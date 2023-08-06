import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import {
  CALLBACK_URLS,
  FLUTTER_CALLBACK_URL,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  LOGOUT_URLS,
  FLUTTER_LOGOUT_URL,
} from '../../configs/cognito/oauth';
import { AUTH_CERT_ARN } from '../../configs/common/arn';
import { AUTH_DOMAIN } from '../../configs/route53/domain';
import { PreSignupWasedaMailValidator } from '../common/lambda-functions';

export abstract class AbstractAuthProvider extends Construct {
  abstract readonly pool: cognito.UserPool;
  abstract readonly clients: { [name: string]: cognito.UserPoolClient };
  abstract readonly domain: cognito.UserPoolDomain;

  protected constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  getDomain(): string {
    const domainName: cognito.UserPoolDomain | undefined = this.domain;

    if (typeof domainName === 'undefined') {
      throw RangeError('Domain not configured for this API endpoint.');
    }
    return domainName.domainName;
  }
}

/**
 * User authentication service for WasedaTime
 */
export class WasedaTimeUserAuth extends AbstractAuthProvider {
  readonly pool: cognito.UserPool;
  readonly clients: { [name: string]: cognito.UserPoolClient } = {};
  readonly domain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, zone: route53.IHostedZone) {
    super(scope, id);

    this.pool = new cognito.UserPool(this, 'main-user-pool', {
      accountRecovery: cognito.AccountRecovery.NONE,
      autoVerify: { email: false, phone: false },
      email: cognito.UserPoolEmail.withCognito(),
      enableSmsRole: false,
      mfa: cognito.Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: true,
      },
      signInCaseSensitive: true,
      smsRole: undefined,
      standardAttributes: {
        email: {
          required: true,
        },
      },
      userPoolName: 'wasedatime-users',
      lambdaTriggers: {
        preSignUp: new PreSignupWasedaMailValidator(this, 'presign-up-handle')
          .baseFunction,
      },
    });

    this.pool.registerIdentityProvider(
      new cognito.UserPoolIdentityProviderGoogle(this, 'google-idp', {
        clientId: GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
        userPool: this.pool,
        attributeMapping: {
          email: cognito.ProviderAttribute.GOOGLE_EMAIL,
          preferredUsername: cognito.ProviderAttribute.GOOGLE_NAME,
          profilePicture: cognito.ProviderAttribute.GOOGLE_PICTURE,
        },
        scopes: ['email', 'openid', 'profile'],
      }),
    );

    this.clients['web-app'] = this.pool.addClient('web-app-client', {
      userPoolClientName: 'web-app',
      authFlows: {
        custom: true,
        userSrp: true,
      },
      generateSecret: false,
      oAuth: {
        callbackUrls: CALLBACK_URLS,
        logoutUrls: LOGOUT_URLS,
      },
      preventUserExistenceErrors: true,
    });

    this.clients['flutter-app'] = this.pool.addClient('flutter-app-client', {
      userPoolClientName: 'flutter-app',
      authFlows: {
        custom: true,
        userSrp: true,
      },
      generateSecret: false,
      oAuth: {
        callbackUrls: FLUTTER_CALLBACK_URL,
        logoutUrls: FLUTTER_LOGOUT_URL,
      },
      preventUserExistenceErrors: true,
    });

    // todo add custom ses in us-east-1

    // fixme cross region resource
    // const cert = new Certificate(this, 'auth-cert', {
    //     domainName: AUTH_DOMAIN,
    //     validation: CertificateValidation.fromDns(zone)
    // });
    this.domain = this.pool.addDomain('auth-domain', {
      customDomain: {
        domainName: AUTH_DOMAIN,
        certificate: acm.Certificate.fromCertificateArn(
          this,
          'auth-domain-cert',
          AUTH_CERT_ARN,
        ),
      },
    });
    new route53.ARecord(this, 'alias-record', {
      zone: zone,
      target: route53.RecordTarget.fromAlias(
        new route53_targets.UserPoolDomainTarget(this.domain),
      ),
      recordName: AUTH_DOMAIN,
    });
  }
}
