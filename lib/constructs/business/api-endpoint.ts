import * as cdk from "@aws-cdk/core";
import {
    AuthorizationType,
    CfnAuthorizer,
    Deployment,
    DomainName,
    EndpointType,
    IAuthorizer,
    LambdaRestApi,
    MethodLoggingLevel,
    RequestValidator,
    ResponseType,
    RestApi,
    SecurityPolicy,
    SpecRestApi,
    Stage
} from "@aws-cdk/aws-apigateway";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import * as crypto from 'crypto';

import {AbstractRestApiService} from "./api-service";
import {apiServiceMap} from "../../configs/api/service";
import {STAGE} from "../../configs/common/aws";
import {defaultHeaders} from "../../configs/api/cors";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {ApiGatewayDomain} from "@aws-cdk/aws-route53-targets";
import {API_DOMAIN} from "../../configs/route53/domain";
import {DataEndpoint} from "../../configs/common/registry";


export interface ApiEndpointProps {

    zone: IHostedZone;

    dataSources: { [source in DataEndpoint]?: string };

    authProvider?: string;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props?: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    readonly apiEndpoint: RestApi;

    abstract readonly apiServices: { [name: string]: AbstractRestApiService };

    abstract readonly stages: { [name: string]: Stage };

    private readonly authorizer: IAuthorizer;

    private readonly reqValidator: RequestValidator;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        // Authorizer for methods that requires user login
        this.authorizer = {
            authorizerId: new CfnAuthorizer(this, 'cognito-authorizer', {
                name: 'cognito-authorizer',
                identitySource: 'method.request.header.Authorization',
                providerArns: [props.authProvider!],
                restApiId: this.apiEndpoint.restApiId,
                type: AuthorizationType.COGNITO
            }).ref,
            authorizationType: AuthorizationType.COGNITO
        };
        // Request Validator
        this.reqValidator = new RequestValidator(this, 'req-validator', {
            restApi: this.apiEndpoint,
            requestValidatorName: "strict-validator",
            validateRequestBody: true,
            validateRequestParameters: true
        });
    }

    public getDomain(): string {
        const domainName: DomainName | undefined = this.apiEndpoint.domainName;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
    }

    protected addService(name: string, dataSource?: string, auth: boolean = false): this {
        this.apiServices[name] = new apiServiceMap[name](this, 'timetable-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: dataSource,
            authorizer: auth ? this.authorizer : undefined,
            validator: this.reqValidator
        });
        return this;
    }
}

/**
 * The REST API Endpoint of WasedaTime
 */
export class WasedaTimeRestApiEndpoint extends AbstractRestApiEndpoint {
    /**
     * REST API Gateway entity
     */
    readonly apiEndpoint: RestApi;
    /**
     * Services provided by this API
     */
    readonly apiServices: { [name: string]: AbstractRestApiService };
    /**
     * Stages of this API
     */
    readonly stages: { [name: string]: Stage } = {};

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-rest-api",
            description: "The main API endpoint for WasedaTime Web App.",
            endpointTypes: [EndpointType.REGIONAL],
            deploy: false,
            binaryMediaTypes: ['application/pdf', 'image/png']
        });
        this.apiEndpoint.addGatewayResponse('4xx-resp', {
            type: ResponseType.DEFAULT_4XX,
            responseHeaders: defaultHeaders
        });
        this.apiEndpoint.addGatewayResponse('5xx-resp', {
            type: ResponseType.DEFAULT_5XX,
            responseHeaders: defaultHeaders
        });

        // API Domain
        const cert = new Certificate(this, 'api-cert', {
            domainName: API_DOMAIN,
            validation: CertificateValidation.fromDns(props.zone)
        });
        const domain = this.apiEndpoint.addDomainName('domain', {
            certificate: cert,
            domainName: API_DOMAIN,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2
        });
        new ARecord(this, 'alias-record', {
            zone: props.zone,
            target: RecordTarget.fromAlias(new ApiGatewayDomain(domain)),
            recordName: API_DOMAIN
        });
        // Mapping from URL path to stages
        domain.addBasePathMapping(this.apiEndpoint, {
            basePath: 'staging',
            stage: this.stages['dev']
        });
        domain.addBasePathMapping(this.apiEndpoint, {
            basePath: 'v1',
            stage: this.stages['prod']
        });
        // API Services
        this.addService("SYLLABUS", props.dataSources[DataEndpoint.SYLLABUS])
            .addService("COURSE_REVIEW", props.dataSources[DataEndpoint.COURSE_REVIEWS], true)
            .addService("FEEDS")
            .addService("CAREER")
            .addService("TIMETABLE", props.dataSources[DataEndpoint.TIMETABLE], true);
        // Deployments
        const prodDeployment = new Deployment(this, 'prod-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        const devDeployment = new Deployment(this, 'dev-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        // hash for detecting changes to api configs
        const hash = crypto.createHash('md5').update(JSON.stringify(this.apiServices)).digest('hex');
        if (STAGE === 'dev') {
            devDeployment.addToLogicalId(hash);
        } else if (STAGE === 'prod') {
            prodDeployment.addToLogicalId(hash);
        }
        // Stages
        this.stages['prod'] = new Stage(this, 'prod-stage', {
            stageName: 'prod',
            deployment: prodDeployment,
            description: "Production stage",
            throttlingRateLimit: 50,
            throttlingBurstLimit: 50,
            variables: {["STAGE"]: STAGE},
            loggingLevel: MethodLoggingLevel.ERROR,
            dataTraceEnabled: true
        });
        this.stages['dev'] = new Stage(this, 'dev-stage', {
            stageName: 'dev',
            deployment: devDeployment,
            description: "Develop stage",
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            variables: {["STAGE"]: STAGE},
            loggingLevel: MethodLoggingLevel.ERROR,
            dataTraceEnabled: true
        });
    }
}