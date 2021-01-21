import * as cdk from "@aws-cdk/core";
import {
    AuthorizationType,
    CfnAuthorizer,
    Deployment,
    DomainName,
    EndpointType,
    LambdaRestApi,
    RequestValidator,
    ResponseType,
    RestApi,
    SecurityPolicy,
    SpecRestApi,
    Stage
} from "@aws-cdk/aws-apigateway";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";
import {Certificate} from "@aws-cdk/aws-certificatemanager";
import * as uuid from "uuid";

import {
    AbstractRestApiService,
    CareerApiService,
    CourseReviewsApiService,
    FeedsApiService,
    SyllabusApiService,
    TimetableApiService
} from "./api-service";
import {ApiServices} from "../../configs/api/service";
import {STAGE} from "../../configs/common/aws";
import {API_CERT_ARN} from "../../configs/common/arn";
import {WEBAPP_DOMAIN} from "../../configs/amplify/website";
import {defaultHeaders} from "../../configs/api/cors";


export interface ApiEndpointProps {

    dataSources?: { [service in ApiServices]?: string };

    authProvider?: string;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props?: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: RestApi;

    abstract readonly apiServices: { [name in ApiServices]?: AbstractRestApiService };

    abstract readonly stages: { [name: string]: Stage };

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }

    getDomain(): string {
        const domainName: DomainName | undefined = this.apiEndpoint.domainName;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
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
    readonly apiServices: { [name in ApiServices]?: AbstractRestApiService } = {};
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
            cloudWatchRole: false,
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

        const prodDeployment = new Deployment(this, 'prod-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        const devDeployment = new Deployment(this, 'dev-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false
        });
        if (STAGE === 'dev') {
            devDeployment.addToLogicalId(uuid.v4());
        } else if (STAGE === 'prod') {
            prodDeployment.addToLogicalId(uuid.v4());
        }
        // Stages
        this.stages['prod'] = new Stage(this, 'prod-stage', {
            stageName: 'prod',
            deployment: prodDeployment,
            description: "Production stage",
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            variables: {["STAGE"]: STAGE}
        });
        this.stages['dev'] = new Stage(this, 'dev-stage', {
            stageName: 'dev',
            deployment: devDeployment,
            description: "Develop stage",
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            variables: {["STAGE"]: STAGE}
        });
        // API Domain
        const domain = this.apiEndpoint.addDomainName('domain', {
            certificate: Certificate.fromCertificateArn(this, 'api-domain', API_CERT_ARN),
            domainName: "api." + WEBAPP_DOMAIN,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2
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
        const reqValidator = new RequestValidator(this, 'req-validator', {
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