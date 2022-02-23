import * as apigw2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as appsync from '@aws-cdk/aws-appsync-alpha';
import { Duration, Expiration } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import * as flatted from 'flatted';
import { defaultHeaders } from '../../configs/api-gateway/cors';
import { STAGE } from '../../configs/common/aws';
import { API_DOMAIN } from '../../configs/route53/domain';
import { GraphqlApiService, GraphqlApiServiceId, graphqlApiServiceMap } from './graphql-api-service';
import { AbstractHttpApiService } from './http-api-service';
import { RestApiService, RestApiServiceId, restApiServiceMap } from './rest-api-service';

export enum ApiEndpoint {
  REST,
  AUTH,
  GRAPHQL,
}

export interface ApiEndpointProps {
  zone: route53.IHostedZone;
  authProvider?: cognito.IUserPool;
}

export abstract class AbstractApiEndpoint extends Construct {
  abstract readonly apiEndpoint: apigw.RestApi | apigw.LambdaRestApi | apigw.SpecRestApi | apigw2.HttpApi | appsync.GraphqlApi;

  protected constructor(scope: Construct, id: string, props?: ApiEndpointProps) {
    super(scope, id);
  }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {
  readonly apiEndpoint: apigw.RestApi;
  abstract readonly apiServices: { [name: string]: RestApiService };
  abstract readonly stages: { [name: string]: apigw.Stage };

  protected authorizer: apigw.IAuthorizer;
  protected reqValidator: apigw.RequestValidator;
  protected domain: apigw.DomainName;

  protected constructor(scope: Construct, id: string, props: ApiEndpointProps) {
    super(scope, id, props);
  }

  public getDomain(): string {
    const domainName: apigw.DomainName | undefined = this.apiEndpoint.domainName;

    if (typeof domainName === 'undefined') {
      throw RangeError('Domain not configured for this API endpoint.');
    }
    return domainName.domainName;
  }

  public addService(name: RestApiServiceId, dataSource?: string, auth = false): this {
    this.apiServices[name] = new restApiServiceMap[name](this, `${ name }-api`, {
      dataSource: dataSource,
      authorizer: auth ? this.authorizer : undefined,
      validator: this.reqValidator,
    });
    return this;
  }

  public abstract deploy(): void
}

export abstract class AbstractGraphqlEndpoint extends AbstractApiEndpoint {
  abstract readonly apiEndpoint: appsync.GraphqlApi;

  readonly apiServices: { [name: string]: GraphqlApiService };

  protected authMode: { [mode: string]: appsync.AuthorizationMode } = {};

  protected constructor(scope: Construct, id: string, props: ApiEndpointProps) {
    super(scope, id, props);
  }

  public addService(name: GraphqlApiServiceId, dataSource: string, auth = 'apiKey'): this {
    this.apiServices[name] = new graphqlApiServiceMap[name](this, `${ name }-api`, {
      dataSource: dynamodb.Table.fromTableName(this, `${ name }-table`, dataSource),
      auth: this.authMode[auth],
    });
    return this;
  }

  public getDomain(): string {
    const domain = this.apiEndpoint.graphqlUrl.match(/https:\/\/(.*)\/graphql/g);
    if (domain === null) {
      return '';
    }
    return domain[1];
  }
}

export abstract class AbstractHttpApiEndpoint extends AbstractApiEndpoint {
  abstract readonly apiEndpoint: apigw2.HttpApi;

  abstract readonly apiServices: { [name: string]: AbstractHttpApiService };

  protected constructor(scope: Construct, id: string, props: ApiEndpointProps) {
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
  readonly apiEndpoint: apigw.RestApi;
  /**
   * Services provided by this API
   */
  readonly apiServices: { [name: string]: RestApiService } = {};
  /**
   * Stages of this API
   */
  readonly stages: { [name: string]: apigw.Stage } = {};

  constructor(scope: Construct, id: string, props: ApiEndpointProps) {
    super(scope, id, props);

    this.apiEndpoint = new apigw.RestApi(this, 'rest-api', {
      restApiName: 'wasedatime-rest-api',
      description: 'The main API endpoint for WasedaTime Web App.',
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deploy: false,
      binaryMediaTypes: ['application/pdf', 'image/png'],
    });
    this.apiEndpoint.addGatewayResponse('4xx-resp', {
      type: apigw.ResponseType.DEFAULT_4XX,
      responseHeaders: defaultHeaders,
    });
    this.apiEndpoint.addGatewayResponse('5xx-resp', {
      type: apigw.ResponseType.DEFAULT_5XX,
      responseHeaders: defaultHeaders,
    });

    // Authorizer for methods that requires user login
    this.authorizer = {
      authorizerId: new apigw.CfnAuthorizer(this, 'cognito-authorizer', {
        name: 'cognito-authorizer',
        identitySource: 'method.request.header.Authorization',
        providerArns: [props.authProvider!.userPoolArn],
        restApiId: this.apiEndpoint.restApiId,
        type: apigw.AuthorizationType.COGNITO,
      }).ref,
      authorizationType: apigw.AuthorizationType.COGNITO,
    };
    // Request Validator
    this.reqValidator = new apigw.RequestValidator(this, 'req-validator', {
      restApi: this.apiEndpoint,
      requestValidatorName: 'strict-validator',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // API Domain
    const cert = new acm.Certificate(this, 'api-cert', {
      domainName: API_DOMAIN,
      validation: acm.CertificateValidation.fromDns(props.zone),
    });
    this.domain = this.apiEndpoint.addDomainName('domain', {
      certificate: cert,
      domainName: API_DOMAIN,
      endpointType: apigw.EndpointType.REGIONAL,
      securityPolicy: apigw.SecurityPolicy.TLS_1_2,
      basePath: '(none)',
    });
    new route53.ARecord(this, 'alias-record', {
      zone: props.zone,
      target: route53.RecordTarget.fromAlias(new route53_targets.ApiGatewayDomain(this.domain)),
      recordName: API_DOMAIN,
    });
  }

  public deploy() {
    // Deployments
    const prodDeployment = new apigw.Deployment(this, 'prod-deployment', {
      api: this.apiEndpoint,
      retainDeployments: false,
    });
    const devDeployment = new apigw.Deployment(this, 'dev-deployment', {
      api: this.apiEndpoint,
      retainDeployments: false,
    });
    const hash = Buffer.from(flatted.stringify(this.apiServices), 'binary').toString('base64');
    if (STAGE === 'dev') {
      devDeployment.addToLogicalId(hash);
    } else if (STAGE === 'prod') {
      prodDeployment.addToLogicalId(hash);
    }
    // Stages
    this.stages.prod = new apigw.Stage(this, 'prod-stage', {
      stageName: 'prod',
      deployment: prodDeployment,
      description: 'Production stage',
      throttlingRateLimit: 50,
      throttlingBurstLimit: 50,
      variables: { ['STAGE']: 'prod' },
      loggingLevel: apigw.MethodLoggingLevel.ERROR,
      dataTraceEnabled: true,
      tracingEnabled: true,
    });
    this.stages.dev = new apigw.Stage(this, 'dev-stage', {
      stageName: 'dev',
      deployment: devDeployment,
      description: 'Develop stage',
      throttlingRateLimit: 10,
      throttlingBurstLimit: 10,
      variables: { ['STAGE']: 'dev' },
      loggingLevel: apigw.MethodLoggingLevel.ERROR,
      dataTraceEnabled: true,
      tracingEnabled: true,
    });
    // Mapping from URL path to stages
    this.domain.addBasePathMapping(this.apiEndpoint, {
      basePath: 'staging',
      stage: this.stages.dev,
    });
    this.domain.addBasePathMapping(this.apiEndpoint, {
      basePath: 'v1',
      stage: this.stages.prod,
    });
  }
}

export class WasedaTimeGraphqlEndpoint extends AbstractGraphqlEndpoint {
  readonly apiEndpoint: appsync.GraphqlApi;
  readonly apiServices: { [name: string]: GraphqlApiService } = {};

  constructor(scope: Construct, id: string, props: ApiEndpointProps) {

    super(scope, id, props);

    const apiKeyAuth: appsync.AuthorizationMode = {
      authorizationType: appsync.AuthorizationType.API_KEY,
      apiKeyConfig: {
        name: 'dev',
        expires: Expiration.after(Duration.days(365)),
        description: 'API Key for development environment.',
      },
    };
    this.authMode.apiKey = apiKeyAuth;
    const cognitoAuth: appsync.AuthorizationMode = {
      authorizationType: appsync.AuthorizationType.USER_POOL,
      userPoolConfig: {
        userPool: props.authProvider!,
        appIdClientRegex: 'web-app',
      },
    };
    this.authMode.userPool = cognitoAuth;

    this.apiEndpoint = new appsync.GraphqlApi(this, 'graphql-api', {
      name: 'wasedatime-gql-api',
      authorizationConfig: {
        defaultAuthorization: apiKeyAuth,
        additionalAuthorizationModes: [cognitoAuth],
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      xrayEnabled: true,
    });
  }
}
