import * as cdk from '@aws-cdk/core';

import {AbstractWebApp, AmplifyMonoWebApp, AmplifyWebApp} from "../constructs/presentation/web-app";
import {PresentationLayer} from "../architecture/layers";
import {OperationEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ServiceInterface} from "../architecture/interfaces";
import {webappSiteRules} from "../configs/amplify/website";


export class WasedaTimePresentationLayer extends PresentationLayer {

    readonly app: AbstractWebApp;

    constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, serviceInterface, props);

        const amplifyApp = new AmplifyWebApp(this, 'amplify-web-app', {
            apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.API_REST),
            authDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.AUTH),
        });
        this.app = amplifyApp;

        const monoApp = new AmplifyMonoWebApp(this, 'amplify-monorepo-web-app', {
            apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.API_REST),
            authDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.AUTH),
        });
        monoApp.addMicroApp("syllabus").addMicroApp("campus");
        webappSiteRules.forEach((value => monoApp.app.addCustomRule(value)));

        this.app = monoApp;

        this.operationInterface.setEndpoint(OperationEndpoint.APP, monoApp.app.appId);
    }
}