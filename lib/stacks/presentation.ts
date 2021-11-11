import * as cdk from '@aws-cdk/core';

import {AbstractWebApp, AmplifyMonoWebApp} from "../constructs/presentation/web-app";
import {PresentationLayer} from "../architecture/layers";
import {OperationEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ServiceInterface} from "../architecture/interfaces";
import {webappSiteRules} from "../configs/amplify/website";


export class WasedaTimePresentationLayer extends PresentationLayer {

    readonly app: AbstractWebApp;

    constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, serviceInterface, props);

        const monoApp = new AmplifyMonoWebApp(this, 'amplify-monorepo-web-app', {
            apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.API_REST),
            authDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.AUTH),
        });
        monoApp.addMicroApp("syllabus");
        monoApp.addMicroApp("campus");
        monoApp.addMicroApp("blog");
        monoApp.addMicroApp("feeds");

        webappSiteRules.forEach((value => monoApp.app.addCustomRule(value)));

        this.app = monoApp;
        const appDomains = [monoApp.app.appId].concat(Object.entries(monoApp.microApps).map(value => value[1].appId));

        this.operationInterface.setEndpoint(OperationEndpoint.APP, appDomains);
    }
}
