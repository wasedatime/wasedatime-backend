import * as cdk from '@aws-cdk/core';
import {
    AccountRecovery,
    Mfa,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolDomain
} from "@aws-cdk/aws-cognito";
import {CALLBACK_URLS, LOGOUT_URLS} from "../configs/cognito/oauth";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {WEBAPP_DOMAIN} from "../configs/amplify/website";


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
                from: "noreply@wasedatime.com"
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
                },
                preferredUsername: {
                    mutable: true,
                    required: true
                },
                profilePicture: {
                    mutable: true,
                    required: true
                },
                profilePage: {
                    mutable: true,
                    required: true
                },
            },
            userPoolName: 'wasedatime-users'
        });

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
            preventUserExistenceErrors: true,
            supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
        });

        const authDomainCert = new Certificate(this, 'domain-certificate', {
            domainName: "auth." + WEBAPP_DOMAIN,
            validation: CertificateValidation.fromEmail()
        });
        this.domain = this.userPool.addDomain('auth-domain', {
            customDomain: {
                domainName: "auth." + WEBAPP_DOMAIN,
                certificate: authDomainCert
            }
        });
    }
}