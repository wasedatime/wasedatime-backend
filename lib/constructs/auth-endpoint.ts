import * as cdk from '@aws-cdk/core';
import {UserPool, UserPoolClient, UserPoolDomain} from "@aws-cdk/aws-cognito";


export interface AuthEndpointProps {

}

export abstract class AuthEndpoint extends cdk.Construct {

    abstract userPools: { [name: string]: UserPool };

    abstract endpoint: UserPoolClient;

    abstract domain: UserPoolDomain;

    protected constructor(scope: cdk.Construct, id: string, props: AuthEndpointProps) {

        super(scope, id);
    }
}

export class OauthEndpoint extends AuthEndpoint {

    readonly userPools: { [name: string]: UserPool };

    readonly endpoint: UserPoolClient;

    readonly domain: UserPoolDomain;

    constructor(scope: cdk.Construct, id: string, props: AuthEndpointProps) {
        super(scope, id, props);
    }
}