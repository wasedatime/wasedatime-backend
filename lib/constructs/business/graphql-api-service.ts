import * as cdk from "@aws-cdk/core";
import {AbstractGraphqlEndpoint} from "./api-endpoint";
import {GraphqlApi, Resolver} from "@aws-cdk/aws-appsync";
import {IUserPool} from "@aws-cdk/aws-cognito";
import {ITable} from "@aws-cdk/aws-dynamodb";

export interface GraphqlApiServiceProps {

    apiEndpoint: GraphqlApi;

    dataSource: ITable;

    auth?: IUserPool;
}

export abstract class AbstractGraphqlService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
    }
}

export abstract class SyllabusApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
        const dataSource = props.apiEndpoint.addDynamoDbDataSource('dynamo-db', props.dataSource, {
            description: "Syllabus table from DynamoDB as a data source.",
            name: "syllabus-table"
        });
    }
}

export abstract class CareerApiService extends cdk.Construct {

    abstract readonly resolvers: { [name: string]: Resolver } = {};

    protected constructor(scope: AbstractGraphqlEndpoint, id: string, props: GraphqlApiServiceProps) {
        super(scope, id);
    }
}