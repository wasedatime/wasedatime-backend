import * as cdk from '@aws-cdk/core';

import {AbstractWebApp, AmplifyWebApp} from "../constructs/web-app";
import {PresentationLayer} from "../architecture/layers";
import {ServiceEndpoint} from "../configs/registry";
import {ServiceInterface} from "../architecture/interfaces";


export class WasedaTimePresentationLayer extends PresentationLayer {

    readonly app: AbstractWebApp;

    constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, serviceInterface, props);

        this.app = new AmplifyWebApp(this, 'amplify-web-app', {
            apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.MAIN)
        });
    }
}