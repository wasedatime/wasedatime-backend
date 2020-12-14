import * as cdk from '@aws-cdk/core';
import {App, Branch, Domain} from "@aws-cdk/aws-amplify";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";

import {webappBuildSpec, webappEnv, webappGithub} from '../configs/code-automation';
import {developerAuth, webappSiteRules} from "../configs/website-configs";
import {Duration} from "@aws-cdk/core/lib/duration";

export class WasedatimeWebApp extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const amplifyServiceRole: LazyRole = new LazyRole(this, 'amplify-role', {
            assumedBy: new ServicePrincipal("amplify.amazonaws.com"),
            description: "Allows Amplify Backend Deployment to access AWS resources on your behalf.",
            path: "/aws-service-role/amplify.amazonaws.com/",
            maxSessionDuration: Duration.hours(1)
        });

        const webApp: App = new App(this, 'webapp', {
            appName: "WasedatimeWebApp",
            autoBranchDeletion: true,
            buildSpec: webappBuildSpec,
            customRules: webappSiteRules,
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: webappEnv,
            role: amplifyServiceRole,
            sourceCodeProvider: webappGithub
        });

        const mainBranch: Branch = webApp.addBranch('main', {
            autoBuild: true,
            branchName: "main",
            stage: "PRODUCTION"
        });

        const devBranch: Branch = webApp.addBranch('dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });

        const domain: Domain = new Domain(this, 'domain', {
            app: webApp,
            // domainName: "wasedatime.com",
            subDomains: [
                {branch: devBranch, prefix: "dev"},
                {branch: mainBranch, prefix: "main"}
            ]
        });
    }
}