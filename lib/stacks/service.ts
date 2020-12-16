import * as cdk from "@aws-cdk/core";

import {AbstractApiEndpoint, WasedaTimeRestApiEndpoint} from "../constructs/api-endpoint";


export abstract class ServiceLayer extends cdk.Stack {

    abstract apiEndpoints: { [name: string]: AbstractApiEndpoint };

    protected constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }
}

export class WasedaTimeServiceLayer extends ServiceLayer {

    readonly apiEndpoints: { [name: string]: AbstractApiEndpoint };

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.apiEndpoints["rest"] = new WasedaTimeRestApiEndpoint(this, 'rest-api', {});
    }
}