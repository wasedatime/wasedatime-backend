import * as cdk from "@aws-cdk/core";
import {Duration, Expiration} from "@aws-cdk/core";
import * as rest from "@aws-cdk/aws-apigateway";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import * as gql from "@aws-cdk/aws-appsync";
import {AuthorizationMode, FieldLogLevel, GraphqlApi} from "@aws-cdk/aws-appsync";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {ApiGatewayDomain} from "@aws-cdk/aws-route53-targets";
import {IUserPool} from "@aws-cdk/aws-cognito";
import * as uuid from "uuid";

import {
    AbstractRestApiService,
    CareerApiService,
    CourseReviewsApiService,
    FeedsApiService,
    SyllabusApiService,
    TimetableApiService
} from "./rest-api-service";
import * as gqlService from "./graphql-api-service";
import {AbstractGraphqlApiService} from "./graphql-api-service";
import {ApiServices} from "../../configs/api-gateway/service";
import {STAGE} from "../../configs/common/aws";
import {defaultHeaders} from "../../configs/api-gateway/cors";
import {API_DOMAIN} from "../../configs/route53/domain";
import {AbstractHttpApiService} from "./http-api-service";
import {Table} from "@aws-cdk/aws-dynamodb";


export interface ApiEndpointProps {

    zone: IHostedZone;

    dataSources?: { [service in ApiServices]?: string };

    authProvider?: IUserPool;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: rest.RestApi | rest.LambdaRestApi | rest.SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props?: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: rest.RestApi;

    abstract readonly apiServices: { [name in ApiServices]?: AbstractRestApiService };

    abstract readonly stages: { [name: string]: rest.Stage };

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }

    getDomain(): string {
        const domainName: rest.DomainName | undefined = this.apiEndpoint.domainName;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
    }
}

export abstract class AbstractGraphqlEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: GraphqlApi;

    abstract readonly apiServices: { [name in ApiServices]?: AbstractGraphqlApiService };

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }
}

export abstract class AbstractHttpApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: HttpApi;

    abstract readonly apiServices: { [name in ApiServices]?: AbstractHttpApiService };

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }
}

/**
 * The REST API Endpoint of WasedaTime
 */
export class WasedaTimeRestApiEndpoint extends AbstractRestApiEndpoint {
    /**
     * REST API Gateway entity
     */
    readonly apiEndpoint: rest.RestApi;
    /**
     * Services provided by this API
     */
    readonly apiServices: { [name in ApiServices]?: AbstractRestApiService } = {};
    /**
     * Stages of this API
     */
    readonly stages: { [name: string]: rest.Stage } = {};

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        this.apiEndpoint = new rest.RestApi(this, 'rest-api', {
            restApiName: "wasedatime-rest-api",
            description: "The main API endpoint for WasedaTime Web App.",
            endpointTypes: [rest.EndpointType.REGIONAL],
            deploy: false,
            binaryMediaTypes: ['application/pdf', 'image/png']
        });
        this.apiEndpoint.addGatewayResponse('4xx-resp', {
            type: rest.ResponseType.DEFAULT_4XX,
            responseHeaders: defaultHeaders
        });
        this.apiEndpoint.addGatewayResponse('5xx-resp', {
            type: rest.ResponseType.DEFAULT_5XX,
            responseHeaders: defaultHeaders
        });

        const prodDeployment = new rest.Deployment(this, 'prod-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        const devDeployment = new rest.Deployment(this, 'dev-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        if (STAGE === 'dev') {
            devDeployment.addToLogicalId(uuid.v4());
        } else if (STAGE === 'prod') {
            prodDeployment.addToLogicalId(uuid.v4());
        }
        // Stages
        this.stages['prod'] = new rest.Stage(this, 'prod-stage', {
            stageName: 'prod',
            deployment: prodDeployment,
            description: "Production stage",
            throttlingRateLimit: 50,
            throttlingBurstLimit: 50,
            variables: {["STAGE"]: STAGE},
            loggingLevel: rest.MethodLoggingLevel.ERROR,
            dataTraceEnabled: true
        });
        this.stages['dev'] = new rest.Stage(this, 'dev-stage', {
            stageName: 'dev',
            deployment: devDeployment,
            description: "Develop stage",
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            variables: {["STAGE"]: STAGE},
            loggingLevel: rest.MethodLoggingLevel.ERROR,
            dataTraceEnabled: true
        });
        // API Domain
        const cert = new Certificate(this, 'api-cert', {
            domainName: API_DOMAIN,
            validation: CertificateValidation.fromDns(props.zone)
        });
        const domain = this.apiEndpoint.addDomainName('domain', {
            certificate: cert,
            domainName: API_DOMAIN,
            endpointType: rest.EndpointType.REGIONAL,
            securityPolicy: rest.SecurityPolicy.TLS_1_2
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
        // Authorizer for methods that requires user login
        const authorizer = {
            authorizerId: new rest.CfnAuthorizer(this, 'cognito-authorizer', {
                name: 'cognito-authorizer',
                identitySource: 'method.request.header.Authorization',
                providerArns: [props.authProvider?.userPoolArn!],
                restApiId: this.apiEndpoint.restApiId,
                type: rest.AuthorizationType.COGNITO
            }).ref,
            authorizationType: rest.AuthorizationType.COGNITO
        };
        // Request Validator
        const reqValidator = new rest.RequestValidator(this, 'req-validator', {
            restApi: this.apiEndpoint,
            requestValidatorName: "strict-validator",
            validateRequestBody: true,
            validateRequestParameters: true
        });
        // API Services
        this.apiServices[ApiServices.SYLLABUS] = new SyllabusApiService(this, 'syllabus-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: props.dataSources![ApiServices.SYLLABUS],
            validator: reqValidator
        });
        this.apiServices[ApiServices.COURSE_REVIEW] = new CourseReviewsApiService(this, 'course-reviews-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: props.dataSources![ApiServices.COURSE_REVIEW],
            authorizer: authorizer,
            validator: reqValidator
        });
        this.apiServices[ApiServices.FEEDS] = new FeedsApiService(this, 'feeds-api', {
            apiEndpoint: this.apiEndpoint,
            validator: reqValidator
        });
        this.apiServices[ApiServices.CAREER] = new CareerApiService(this, 'career-api', {
            apiEndpoint: this.apiEndpoint,
            validator: reqValidator
        });
        this.apiServices[ApiServices.TIMETABLE] = new TimetableApiService(this, 'timetable-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: props.dataSources![ApiServices.TIMETABLE],
            authorizer: authorizer,
            validator: reqValidator
        });
    }
}

export class WasedaTimeHttpEndpoint extends AbstractHttpApiEndpoint {

    readonly apiEndpoint: HttpApi;

    readonly apiServices: { [name in ApiServices]?: AbstractHttpApiService };

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        this.apiEndpoint = new HttpApi(this, 'http-api-endpoint', {
            apiName: "wasedatime-http-api",
            description: "The main API endpoint for WasedaTime Web App.",
            disableExecuteApiEndpoint: true
        });
    }
}

export class WasedaTimeGraphqlEndpoint extends AbstractGraphqlEndpoint {

    readonly apiEndpoint: GraphqlApi;

    readonly apiServices: { [name in ApiServices]?: AbstractGraphqlApiService };

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {

        super(scope, id, props);

        const apiKeyAuth: AuthorizationMode = {
            authorizationType: gql.AuthorizationType.API_KEY,
            apiKeyConfig: {
                name: 'dev',
                expires: Expiration.after(Duration.days(365)),
                description: "API Key for development environment."
            }
        };
        const cognitoAuth: AuthorizationMode = {
            authorizationType: gql.AuthorizationType.USER_POOL,
            userPoolConfig: {
                userPool: props.authProvider!,
                appIdClientRegex: 'web-app'
            }
        };

        this.apiEndpoint = new GraphqlApi(this, 'graphql-api', {
            name: "wasedatime-gql-api",
            authorizationConfig: {
                defaultAuthorization: apiKeyAuth,
                additionalAuthorizationModes: [cognitoAuth]
            },
            logConfig: {
                fieldLogLevel: FieldLogLevel.ALL
            }
        });
        new gqlService.SyllabusApiService(this, 'syllabus-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: Table.fromTableArn(this, 'syllabus-table', "arn:aws:dynamodb:ap-northeast-1:564383102056:table/syllabus")
        });
    }
}