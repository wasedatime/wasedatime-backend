import * as cdk from '@aws-cdk/core';

import {AbstractWebApp, AmplifyWebApp} from "../constructs/web-app";


export abstract class PresentationLayer extends cdk.Stack {

    abstract app: AbstractWebApp;

    protected constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }
}

export class WasedaTimePresentationLayer extends PresentationLayer {

    readonly app: AbstractWebApp;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.app = new AmplifyWebApp(this, 'amplify-web-app');
    }
}