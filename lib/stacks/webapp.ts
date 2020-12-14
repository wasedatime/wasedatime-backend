import * as cdk from '@aws-cdk/core';
import {App, Branch} from "@aws-cdk/aws-amplify";
import {Role} from "@aws-cdk/aws-iam";

import {webappBuildSpec, webappEnv, webappGithub} from '../configs/code-automation';
import {developerAuth, webappSiteRules} from "../configs/website-configs";

export class WasedatimeWebApp extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const webApp: App = new App(this, 'wasedatime-webapp', {
            appName: "WasedatimeWebApp",
            autoBranchDeletion: true,
            buildSpec: webappBuildSpec,
            customRules: webappSiteRules,
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: webappEnv,
            role: Role.fromRoleArn(this,
                'wasedatime-webapp-service-role',
                "arn:aws:iam::564383102056:role/AWSServiceRoleAmplify"
            ),
            sourceCodeProvider: webappGithub
        });

        const devBranch: Branch = webApp.addBranch('wasedatime-webapp-dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });
    }
}