import * as cdk from "@aws-cdk/core";
import {
    Deployment,
    DomainName,
    EndpointType,
    LambdaRestApi,
    RestApi,
    SpecRestApi,
    Stage
} from "@aws-cdk/aws-apigateway";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";
import {
    AccountRecovery,
    Mfa,
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolDomain,
    UserPoolIdentityProviderGoogle
} from "@aws-cdk/aws-cognito";
import {Certificate} from "@aws-cdk/aws-certificatemanager";
import * as uuid from "uuid";

import {AbstractRestApiService, CourseReviewsApiService, FeedsApiService, SyllabusApiService} from "./api-service";
import {baseJsonApiSchema} from "../../configs/api/schema";
import {PreSignupWasedaMailValidator} from "../common/lambda-functions";
import {ApiServices} from "../../configs/api/service";
import {
    CALLBACK_URLS,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    LOGOUT_URLS
} from "../../configs/cognito/oauth";
import {WEBAPP_DOMAIN} from "../../configs/amplify/website";
import {AUTH_CERT_ARN} from "../../configs/common/arn";
import {STAGE} from "../../configs/common/aws";


export interface ApiEndpointProps {

    dataSources?: { [service in ApiServices]?: string };
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi | UserPool;

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

export abstract class AbstractAuthApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: UserPool;

    abstract readonly clients: { [name: string]: UserPoolClient } = {};

    abstract readonly domain: UserPoolDomain;

    protected constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
    }

    getDomain(): string {
        const domainName: UserPoolDomain | undefined = this.domain;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
    }
}

export class WasedaTimeRestApiEndpoint extends AbstractRestApiEndpoint {

    readonly apiEndpoint: RestApi;

    readonly apiServices: { [name in ApiServices]?: AbstractRestApiService } = {};

    readonly stages: { [name: string]: Stage } = {};

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-rest-api",
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: false,
            deploy: false
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

        // const domain = this.apiEndpoint.addDomainName('domain', {
        //     certificate: Certificate.fromCertificateArn(this, 'api-domain', API_CERT_ARN),
        //     domainName: "api." + WEBAPP_DOMAIN,
        //     endpointType: EndpointType.REGIONAL,
        //     securityPolicy: SecurityPolicy.TLS_1_2
        // });
        // domain.addBasePathMapping(this.apiEndpoint, {
        //     basePath: 'v1',
        //     stage: this.stages['prod']
        // });
        // domain.addBasePathMapping(this.apiEndpoint, {
        //     basePath: 'staging',
        //     stage: this.stages['dev']
        // });

        const baseJsonApiModel = this.apiEndpoint.addModel('base-json-api-model', {
            schema: baseJsonApiSchema,
            contentType: "application/json",
            description: "Base model for JSON-API specification.",
            modelName: "BaseJsonAPI"
        });

        this.apiServices[ApiServices.SYLLABUS] = new SyllabusApiService(this, 'syllabus-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: props.dataSources![ApiServices.SYLLABUS]
        });
        this.apiServices[ApiServices.COURSE_REVIEW] = new CourseReviewsApiService(this, 'course-reviews-api', {
            apiEndpoint: this.apiEndpoint,
            dataSource: props.dataSources![ApiServices.COURSE_REVIEW]
        });
        this.apiServices[ApiServices.FEEDS] = new FeedsApiService(this, 'feeds-api', {
            apiEndpoint: this.apiEndpoint
        });
    }
}

export class WasedaTimeAuthApiEndpoint extends AbstractAuthApiEndpoint {

    readonly apiEndpoint: UserPool;

    readonly clients: { [name: string]: UserPoolClient } = {};

    readonly domain: UserPoolDomain;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.apiEndpoint = new UserPool(this, 'main-user-pool', {
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            autoVerify: {email: true, phone: false},
            emailSettings: {
                // from: "noreply@wasedatime.com"
            },
            enableSmsRole: false,
            mfa: Mfa.OFF,
            passwordPolicy: {
                minLength: 8,
                requireDigits: true,
                requireLowercase: true,
                requireUppercase: false,
                requireSymbols: false
            },
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                username: true
            },
            signInCaseSensitive: true,
            smsRole: undefined,
            standardAttributes: {
                email: {
                    required: true
                }
            },
            userPoolName: 'wasedatime-users',
            lambdaTriggers: {
                preSignUp: new PreSignupWasedaMailValidator(this, 'presign-up-handle').baseFunction
            }
        });

        this.apiEndpoint.registerIdentityProvider(new UserPoolIdentityProviderGoogle(this, 'google-idp', {
            clientId: GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
            userPool: this.apiEndpoint,
            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
                preferredUsername: ProviderAttribute.GOOGLE_NAME,
                profilePicture: ProviderAttribute.GOOGLE_PICTURE
            },
            scopes: ['email', 'openid', 'profile']
        }));

        this.clients['web-app'] = this.apiEndpoint.addClient('web-app-client', {
            userPoolClientName: "web-app",
            authFlows: {
                custom: true,
                userSrp: true
            },
            generateSecret: false,
            oAuth: {
                callbackUrls: CALLBACK_URLS,
                logoutUrls: LOGOUT_URLS
            },
            preventUserExistenceErrors: true
        });

        // todo add custom ses in us-east-1
        this.domain = this.apiEndpoint.addDomain('auth-domain', {
            customDomain: {
                domainName: "auth." + WEBAPP_DOMAIN,
                certificate: Certificate.fromCertificateArn(this, 'auth-domain-cert', AUTH_CERT_ARN)
            }
        });
    }
}