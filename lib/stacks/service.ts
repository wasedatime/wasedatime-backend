import * as cdk from "@aws-cdk/core";

import {AbstractApiEndpoint, AbstractRestApiEndpoint, WasedaTimeRestApiEndpoint} from "../constructs/api-endpoint";
import {DataEndpoint, ServiceEndpoint} from "../configs/registry";
import {ApiEndpoint} from "../configs/api/api-endpoint";
import {ServiceLayer} from "../architecture/layers";
import {DataInterface} from "../architecture/interfaces";


export class WasedaTimeServiceLayer extends ServiceLayer {

    apiEndpoints: { [name in ApiEndpoint]?: AbstractApiEndpoint } = {};

    constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, props: cdk.StackProps) {
        super(scope, id, dataInterface, props);

        const mainApiEndpoint: AbstractRestApiEndpoint = new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
            dataSource: this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS)
        });

        this.apiEndpoints[ApiEndpoint.MAIN] = mainApiEndpoint;

        this.serviceInterface.setEndpoint(ServiceEndpoint.MAIN, mainApiEndpoint.getDomain());
    }
}