import * as cdk from '@aws-cdk/core';

import {AbstractWebApp, AmplifyWebApp, OpenApiWebsite} from "../constructs/presentation/web-app";
import {PresentationLayer} from "../architecture/layers";
import {OperationEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ServiceInterface} from "../architecture/interfaces";


export class WasedaTimePresentationLayer extends PresentationLayer {

    readonly app: AbstractWebApp;

    readonly doc: AbstractWebApp;

    constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, serviceInterface, props);

        const amplifyApp = new AmplifyWebApp(this, 'amplify-web-app', {
            apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.API_MAIN),
            authDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.AUTH)
        });

        this.app = amplifyApp;

        this.operationInterface.setEndpoint(OperationEndpoint.APP, amplifyApp.app.appId);

        this.doc = new OpenApiWebsite(this, 'open-api-website', {});
    }
}