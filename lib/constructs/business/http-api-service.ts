import * as cdk from "@aws-cdk/core";
import {CfnAuthorizer, HttpApi, HttpMethod, HttpRoute} from "@aws-cdk/aws-apigatewayv2";

import {AbstractHttpApiEndpoint} from "./api-endpoint";


export interface HttpApiServiceProps {

    apiEndpoint: HttpApi;

    dataSource?: string;

    authorizer?: CfnAuthorizer;
}

export abstract class AbstractHttpApiService extends cdk.Construct {

    abstract readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: HttpRoute } };

    protected constructor(scope: AbstractHttpApiEndpoint, id: string, props: HttpApiServiceProps) {
        super(scope, id);
    }
}