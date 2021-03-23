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
        monoApp.addMicroApp("syllabus").addMicroApp("campus");
        webappSiteRules.forEach((value => monoApp.app.addCustomRule(value)));

        const amplifyArnOutput = new cdk.CfnOutput(this, 'BucketArnOutput', {
            value: monoApp.microApps.syllabus.appId,
            exportName: 'presentation:ExportsOutputFnGetAttamplifymonorepowebappsyllabusappE2E73B95DefaultDomainA48D6986',
        });
        amplifyArnOutput.overrideLogicalId('ExportsOutputFnGetAttamplifymonorepowebappsyllabusappE2E73B95DefaultDomainA48D6986');
        const amplifyArnOutput2 = new cdk.CfnOutput(this, 'output2', {
            value: monoApp.microApps.campus.appId,
            exportName: 'presentation:ExportsOutputFnGetAttamplifymonorepowebappcampusappBA86D23CDefaultDomainC666940C',
        });
        amplifyArnOutput2.overrideLogicalId('ExportsOutputFnGetAttamplifymonorepowebappcampusappBA86D23CDefaultDomainC666940C');
        this.app = monoApp;
        const appDomains = [monoApp.app.appId].concat(Object.entries(monoApp.microApps).map(value => value[1].appId));

        this.operationInterface.setEndpoint(OperationEndpoint.APP, appDomains);
    }
}
