import {App, Branch, Domain} from "@aws-cdk/aws-amplify";
import * as cdk from "@aws-cdk/core";
import {Construct} from "@aws-cdk/core";
import {AbstractTaskManager, AmplifyBuildStatusNotifier} from "./task-managers";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";
import {AwsServicePrincipal} from "../configs/aws";
import {Duration} from "@aws-cdk/core/lib/duration";
import {webappBuildSpec, webappEnv, webappGithub} from "../configs/code-automation";
import {developerAuth, WEBAPP_DOMAIN, webappSiteRules} from "../configs/website";


export interface WebAppProps {

}

export abstract class AbstractWebApp extends Construct {

    abstract app: App;

    abstract branches?: { [env: string]: Branch };

    abstract domain?: Domain;

    abstract statusNotifier?: AbstractTaskManager;

    protected constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
    }
}

export class AmplifyWebApp extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    readonly statusNotifier?: AmplifyBuildStatusNotifier;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

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
        this.branches["main"] = mainBranch;
        const devBranch: Branch = this.app.addBranch('dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });
        this.branches["dev"] = devBranch;

        this.statusNotifier = new AmplifyBuildStatusNotifier(this, 'build-notifier', this.app, {});

        this.domain = this.app.addDomain('domain', {
            domainName: WEBAPP_DOMAIN,
            subDomains: [
                {branch: devBranch, prefix: "dev"},
                {branch: mainBranch, prefix: "main"}
            ]
        });
    }
}