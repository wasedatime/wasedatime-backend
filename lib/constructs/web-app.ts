import {App, Branch, Domain} from "@aws-cdk/aws-amplify";
import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core/lib/duration";
import {LazyRole, ManagedPolicy, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../configs/aws";
import {developerAuth, WEBAPP_DOMAIN, webappSiteRules} from "../configs/amplify/website";
import {webappBuildSpec, webappEnv} from "../configs/amplify/build-setting";
import {webAppCode} from "../configs/amplify/codebase";


export interface WebAppProps {

    apiDomain?: string;

    authDomain?: string;
}

export abstract class AbstractWebApp extends cdk.Construct {

    abstract app: App;

    abstract branches?: { [env: string]: Branch };

    abstract domain?: Domain;

    protected constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id);
    }
}

export class AmplifyWebApp extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id, props);

        const amplifyServiceRole: LazyRole = new LazyRole(this, 'amplify-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.AMPLIFY),
            description: "Allows Amplify Backend Deployment to access AWS resources on your behalf.",
            path: `/service-role/${AwsServicePrincipal.AMPLIFY}/`,
            maxSessionDuration: Duration.hours(1),
            roleName: "amplify-webapp-deploy",
            managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, 'admin-access',
                "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess")]
        });

        this.app = new App(this, 'app', {
            appName: "WasedatimeWebApp",
            autoBranchDeletion: true,
            buildSpec: webappBuildSpec,
            customRules: webappSiteRules,
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: webappEnv,
            role: amplifyServiceRole,
            sourceCodeProvider: webAppCode,

        });

        const mainBranch: Branch = this.app.addBranch('main', {
            autoBuild: true,
            branchName: "main",
            stage: "PRODUCTION"
        });
        this.branches["main"] = mainBranch;
        const devBranch: Branch = this.app.addBranch('dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });
        this.branches["dev"] = devBranch;

        this.domain = this.app.addDomain('domain', {
            domainName: WEBAPP_DOMAIN,
            subDomains: [
                // {branch: devBranch, prefix: "dev"},
                {branch: mainBranch, prefix: "main"}
            ]
        });
    }
}