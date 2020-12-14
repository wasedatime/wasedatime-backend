import * as cdk from '@aws-cdk/core';
import {App, Branch, Domain} from "@aws-cdk/aws-amplify";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Duration} from "@aws-cdk/core/lib/duration";

import {webappBuildSpec, webappEnv, webappGithub} from '../configs/code-automation';
import {developerAuth, WEBAPP_DOMAIN, webappSiteRules} from "../configs/website";
import {AwsServicePrincipal} from "../configs/aws";


export class WasedatimeWebApp extends cdk.Stack {

    private readonly app: App;

    private readonly branches: { [key: string]: Branch };

    private readonly domain: Domain;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const amplifyServiceRole: LazyRole = new LazyRole(this, 'amplify-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.AMPLIFY),
            description: "Allows Amplify Backend Deployment to access AWS resources on your behalf.",
            path: `/aws-service-role/${AwsServicePrincipal.AMPLIFY}/`,
            maxSessionDuration: Duration.hours(1),
            roleName: "amplify-webapp-deploy"
        });

        this.app = new App(this, 'webapp', {
            appName: "WasedatimeWebApp",
            autoBranchDeletion: true,
            buildSpec: webappBuildSpec,
            customRules: webappSiteRules,
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: webappEnv,
            role: amplifyServiceRole,
            sourceCodeProvider: webappGithub
        });

        const mainBranch: Branch = this.app.addBranch('main', {
            autoBuild: true,
            branchName: "main",
            stage: "PRODUCTION"
        });

        const devBranch: Branch = this.app.addBranch('dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });

        this.domain = this.app.addDomain('domain', {
            domainName: WEBAPP_DOMAIN,
            subDomains: [
                {branch: devBranch, prefix: "dev"},
                {branch: mainBranch, prefix: "main"}
            ]
        });
    }
}