import * as cdk from "@aws-cdk/core";
import {AbstractGraphqlEndpoint} from "./api-endpoint";
import {GraphqlApi, Resolver} from "@aws-cdk/aws-appsync";
import {IUserPool} from "@aws-cdk/aws-cognito";

export interface ApiServiceProps {

    apiEndpoint: GraphqlApi;

    dataSource?: string;

    auth?: IUserPool;
}

export abstract class AbstractGraphqlService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id);
    }
}

export abstract class SyllabusApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id);
    }
}

export abstract class CareerApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id);
    }
}