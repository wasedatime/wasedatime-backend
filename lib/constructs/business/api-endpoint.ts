import * as cdk from "@aws-cdk/core";
import {Duration, Expiration} from "@aws-cdk/core";
import * as rest from "@aws-cdk/aws-apigateway";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import * as gql from "@aws-cdk/aws-appsync";
import {AuthorizationMode, FieldLogLevel, GraphqlApi} from "@aws-cdk/aws-appsync";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {ApiGatewayDomain} from "@aws-cdk/aws-route53-targets";
import {Table} from "@aws-cdk/aws-dynamodb";
import {IUserPool} from "@aws-cdk/aws-cognito";
import * as flatted from 'flatted';

import {AbstractRestApiService} from "./rest-api-service";
import {apiServiceMap} from "../../configs/api-gateway/service";
import {AbstractGraphqlApiService} from "./graphql-api-service";
import {STAGE} from "../../configs/common/aws";
import {defaultHeaders} from "../../configs/api-gateway/cors";
import {API_DOMAIN} from "../../configs/route53/domain";
import {AbstractHttpApiService} from "./http-api-service";


export interface ApiEndpointProps {

    zone: IHostedZone;

    authProvider?: IUserPool;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: rest.RestApi | rest.LambdaRestApi | rest.SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props?: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    readonly apiEndpoint: rest.RestApi;

    abstract readonly apiServices: { [name: string]: AbstractRestApiService };

    abstract readonly stages: { [name: string]: rest.Stage };

    protected authorizer: rest.IAuthorizer;

    protected reqValidator: rest.RequestValidator;

    protected domain: rest.DomainName;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }

    public getDomain(): string {
        const domainName: rest.DomainName | undefined = this.apiEndpoint.domainName;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
    }

    public addService(name: string, dataSource?: string, auth: boolean = false): this {
        this.apiServices[name] = new apiServiceMap[name](this, `${name}-api`, {
            dataSource: dataSource,
            authorizer: auth ? this.authorizer : undefined,
            validator: this.reqValidator,
        });
        return this;
    }

    public abstract deploy(): void
}

export abstract class AbstractGraphqlEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: GraphqlApi;

    abstract readonly apiServices: { [name: string]: AbstractGraphqlApiService };

    protected authMode: { [mode: string]: AuthorizationMode } = {};

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }

    public addService(name: string, dataSource: string, auth: string = 'apiKey'): this {
        this.apiServices[name] = new apiServiceMap[name](this, `${name}-api`, {
            dataSource: Table.fromTableName(this, `${name}-table`, dataSource),
            auth: this.authMode[auth],
        });
        return this;
    }

    public getDomain(): string {
        const domain = this.apiEndpoint.graphqlUrl.match(/https:\/\/(.*)\/graphql/g);
        if (domain === null) {
            return "";
        }
        return domain[1];
    }
}

export abstract class AbstractHttpApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: HttpApi;

    abstract readonly apiServices: { [name: string]: AbstractHttpApiService };

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
    readonly apiServices: { [name: string]: AbstractRestApiService } = {};
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
            binaryMediaTypes: ['application/pdf', 'image/png'],
        });
        this.apiEndpoint.addGatewayResponse('4xx-resp', {
            type: rest.ResponseType.DEFAULT_4XX,
            responseHeaders: defaultHeaders,
        });
        this.apiEndpoint.addGatewayResponse('5xx-resp', {
            type: rest.ResponseType.DEFAULT_5XX,
            responseHeaders: defaultHeaders,
        });

        // Authorizer for methods that requires user login
        this.authorizer = {
            authorizerId: new rest.CfnAuthorizer(this, 'cognito-authorizer', {
                name: 'cognito-authorizer',
                identitySource: 'method.request.header.Authorization',
                providerArns: [props.authProvider!.userPoolArn],
                restApiId: this.apiEndpoint.restApiId,
                type: rest.AuthorizationType.COGNITO,
            }).ref,
            authorizationType: rest.AuthorizationType.COGNITO,
        };
        // Request Validator
        this.reqValidator = new rest.RequestValidator(this, 'req-validator', {
            restApi: this.apiEndpoint,
            requestValidatorName: "strict-validator",
            validateRequestBody: true,
            validateRequestParameters: true,
        });

        // API Domain
        const cert = new Certificate(this, 'api-cert', {
            domainName: API_DOMAIN,
            validation: CertificateValidation.fromDns(props.zone),
        });
        this.domain = this.apiEndpoint.addDomainName('domain', {
            certificate: cert,
            domainName: API_DOMAIN,
            endpointType: rest.EndpointType.REGIONAL,
            securityPolicy: rest.SecurityPolicy.TLS_1_2,
        });
        new ARecord(this, 'alias-record', {
            zone: props.zone,
            target: RecordTarget.fromAlias(new ApiGatewayDomain(this.domain)),
            recordName: API_DOMAIN,
        });
    }

    public deploy() {
        // Deployments
        const prodDeployment = new rest.Deployment(this, 'prod-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false,
        });
        const devDeployment = new rest.Deployment(this, 'dev-deployment', {
            api: this.apiEndpoint,
            retainDeployments: false,
        });
        const hash = new Buffer(flatted.stringify(this.apiServices), 'binary').toString('base64');
        if (STAGE === 'dev') {
            devDeployment.addToLogicalId(hash);
        } else if (STAGE === 'prod') {
            prodDeployment.addToLogicalId(hash);
        }
        // Stages
        this.stages['prod'] = new rest.Stage(this, 'prod-stage', {
            stageName: 'prod',
            deployment: prodDeployment,
            description: "Production stage",
            throttlingRateLimit: 50,
            throttlingBurstLimit: 50,
            variables: {["STAGE"]: "prod"},
            loggingLevel: rest.MethodLoggingLevel.ERROR,
            dataTraceEnabled: true,
            tracingEnabled: true,
        });
        this.stages['dev'] = new rest.Stage(this, 'dev-stage', {
            stageName: 'dev',
            deployment: devDeployment,
            description: "Develop stage",
            throttlingRateLimit: 10,
            throttlingBurstLimit: 10,
            variables: {["STAGE"]: "dev"},
            loggingLevel: rest.MethodLoggingLevel.ERROR,
            dataTraceEnabled: true,
            tracingEnabled: true,
        });
        // Mapping from URL path to stages
        this.domain.addBasePathMapping(this.apiEndpoint, {
            basePath: 'staging',
            stage: this.stages['dev'],
        });
        this.domain.addBasePathMapping(this.apiEndpoint, {
            basePath: 'v1',
            stage: this.stages['prod'],
        });
    }
}

export class WasedaTimeGraphqlEndpoint extends AbstractGraphqlEndpoint {

    readonly apiEndpoint: GraphqlApi;

    readonly apiServices: { [name: string]: AbstractGraphqlApiService };

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {

        super(scope, id, props);

        const apiKeyAuth: AuthorizationMode = {
            authorizationType: gql.AuthorizationType.API_KEY,
            apiKeyConfig: {
                name: 'dev',
                expires: Expiration.after(Duration.days(365)),
                description: "API Key for development environment.",
            },
        };
        this.authMode["apiKey"] = apiKeyAuth;
        const cognitoAuth: AuthorizationMode = {
            authorizationType: gql.AuthorizationType.USER_POOL,
            userPoolConfig: {
                userPool: props.authProvider!,
                appIdClientRegex: 'web-app',
            },
        };
        this.authMode["userPool"] = cognitoAuth;

        this.apiEndpoint = new GraphqlApi(this, 'graphql-api', {
            name: "wasedatime-gql-api",
            authorizationConfig: {
                defaultAuthorization: apiKeyAuth,
                additionalAuthorizationModes: [cognitoAuth],
            },
            logConfig: {
                fieldLogLevel: FieldLogLevel.ALL,
            },
            xrayEnabled: true,
        });
    }
}