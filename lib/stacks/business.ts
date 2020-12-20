import * as cdk from "@aws-cdk/core";

import {AbstractApiEndpoint, AbstractRestApiEndpoint, WasedaTimeRestApiEndpoint} from "../constructs/api-endpoint";
import {DataEndpoint, ServiceEndpoint} from "../configs/registry";
import {ApiEndpoint} from "../configs/api/api-endpoint";
import {BusinessLayer} from "../architecture/layers";
import {DataInterface} from "../architecture/interfaces";
import {WasedaTimeAuthEndpoint} from "../constructs/auth-endpoint";


export class WasedaTimeBusinessLayer extends BusinessLayer {

    apiEndpoints: { [name in ApiEndpoint]?: AbstractApiEndpoint } = {};

    constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, props: cdk.StackProps) {
        super(scope, id, dataInterface, props);

        const mainApiEndpoint: AbstractRestApiEndpoint = new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
            dataSource: this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS)
        });

        this.apiEndpoints[ApiEndpoint.MAIN] = mainApiEndpoint;

        // this.serviceInterface.setEndpoint(ServiceEndpoint.MAIN, mainApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.MAIN, 'api.wasedatime.com');

        new WasedaTimeAuthEndpoint(this, 'cognito-endpoint', {});
    }
}