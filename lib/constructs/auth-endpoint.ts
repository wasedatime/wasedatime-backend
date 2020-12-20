import * as cdk from '@aws-cdk/core';
import {
    AccountRecovery,
    Mfa,
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolDomain,
    UserPoolIdentityProviderGoogle
} from "@aws-cdk/aws-cognito";
import {CALLBACK_URLS, GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, LOGOUT_URLS} from "../configs/cognito/oauth";
import {WEBAPP_DOMAIN} from "../configs/amplify/website";
import {Certificate} from "@aws-cdk/aws-certificatemanager";


export interface AuthEndpointProps {

}

export abstract class AuthEndpoint extends cdk.Construct {

    abstract userPool: UserPool;

    abstract clients: { [name: string]: UserPoolClient };

    abstract domain: UserPoolDomain;

    protected constructor(scope: cdk.Construct, id: string, props: AuthEndpointProps) {

        super(scope, id);
    }
}

export class WasedaTimeAuthEndpoint extends AuthEndpoint {

    readonly userPool: UserPool;

    readonly clients: { [name: string]: UserPoolClient } = {};

    readonly domain: UserPoolDomain;

    constructor(scope: cdk.Construct, id: string, props: AuthEndpointProps) {
        super(scope, id, props);

        this.userPool = new UserPool(this, 'main-user-pool', {
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
            userPoolName: 'wasedatime-users'
        });

        this.userPool.registerIdentityProvider(new UserPoolIdentityProviderGoogle(this, 'google-idp', {
            clientId: GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: GOOGLE_OAUTH_CLIENT_SECRET,
            userPool: this.userPool,
            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
                preferredUsername: ProviderAttribute.GOOGLE_NAME,
                profilePicture: ProviderAttribute.GOOGLE_PICTURE
            },
            scopes: ['email', 'openid', 'profile']
        }))

        this.clients['web-app'] = this.userPool.addClient('web-app-client', {
            userPoolClientName: "web-app",
            authFlows: {
                custom: true,
                userSrp: true
            },
            generateSecret: true,
            oAuth: {
                callbackUrls: CALLBACK_URLS,
                logoutUrls: LOGOUT_URLS
            },
            preventUserExistenceErrors: true
        });

        // todo add custom ses in us-east-1
        this.domain = this.userPool.addDomain('auth-domain', {
            customDomain: {
                domainName: "auth." + WEBAPP_DOMAIN,
                certificate: Certificate.fromCertificateArn(this, 'auth-domain-cert',
                    'arn:aws:acm:us-east-1:564383102056:certificate/7e29831d-9eb9-4212-9856-4f5fd0d3cafe')
            }
        });
    }
}