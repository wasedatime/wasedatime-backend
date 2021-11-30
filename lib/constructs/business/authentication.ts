import * as cdk from "@aws-cdk/core";
import {
    AccountRecovery,
    Mfa,
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolDomain,
    UserPoolEmail,
    UserPoolIdentityProviderGoogle,
} from "@aws-cdk/aws-cognito";
import {Certificate} from "@aws-cdk/aws-certificatemanager";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";

import {PreSignupWasedaMailValidator} from "../common/lambda-functions";
import {
    CALLBACK_URLS,
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    LOGOUT_URLS,
} from "../../configs/cognito/oauth";
import {AUTH_CERT_ARN} from "../../configs/common/arn";
import {UserPoolDomainTarget} from "@aws-cdk/aws-route53-targets";
import {AUTH_DOMAIN} from "../../configs/route53/domain";

export abstract class AbstractAuthProvider extends cdk.Construct {
    abstract readonly pool: UserPool;

    abstract readonly clients: { [name: string]: UserPoolClient };

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

/**
 * User authentication service for WasedaTime
 */
export class WasedaTimeUserAuth extends AbstractAuthProvider {
    readonly pool: UserPool;

    readonly clients: { [name: string]: UserPoolClient } = {};

    readonly domain: UserPoolDomain;

    constructor(scope: cdk.Construct, id: string, zone: IHostedZone) {
        super(scope, id);

        this.pool = new UserPool(this, 'main-user-pool', {
            accountRecovery: AccountRecovery.NONE,
            autoVerify: {email: false, phone: false},
            email: UserPoolEmail.withCognito(),
            enableSmsRole: false,
            mfa: Mfa.OFF,
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
                preSignUp: new PreSignupWasedaMailValidator(this, 'presign-up-handle').baseFunction,
            },
        });

        this.pool.registerIdentityProvider(new UserPoolIdentityProviderGoogle(this, 'google-idp', {
            clientId: GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
            userPool: this.pool,
            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
                preferredUsername: ProviderAttribute.GOOGLE_NAME,
                profilePicture: ProviderAttribute.GOOGLE_PICTURE,
            },
            scopes: ['email', 'openid', 'profile'],
        }));

        this.clients['web-app'] = this.pool.addClient('web-app-client', {
            userPoolClientName: "web-app",
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

        // todo add custom ses in us-east-1

        // fixme cross region resource
        // const cert = new Certificate(this, 'auth-cert', {
        //     domainName: AUTH_DOMAIN,
        //     validation: CertificateValidation.fromDns(zone)
        // });
        this.domain = this.pool.addDomain('auth-domain', {
            customDomain: {
                domainName: AUTH_DOMAIN,
                certificate: Certificate.fromCertificateArn(this, 'auth-domain-cert', AUTH_CERT_ARN),
            },
        });
        new ARecord(this, 'alias-record', {
            zone: zone,
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(this.domain)),
            recordName: AUTH_DOMAIN,
        });
    }
}
