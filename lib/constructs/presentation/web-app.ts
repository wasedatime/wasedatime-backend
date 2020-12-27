import {App, Branch, Domain} from "@aws-cdk/aws-amplify";
import * as cdk from "@aws-cdk/core";
import {developerAuth, WEBAPP_DOMAIN, webappSiteRules} from "../../configs/amplify/website";
import {openapiBuildSpec, webappBuildSpec} from "../../configs/amplify/build-setting";
import {apiDocCode, webAppCode} from "../../configs/amplify/codebase";


export interface WebAppProps {

    apiDomain?: string;

    authDomain?: string;
}

export abstract class AbstractWebApp extends cdk.Construct {

    abstract readonly app: App;

    abstract readonly branches?: { [env: string]: Branch };

    abstract readonly domain?: Domain;

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

        this.app = new App(this, 'app', {
            appName: "wasedatime-web-app",
            autoBranchDeletion: true,
            buildSpec: webappBuildSpec,
            customRules: webappSiteRules,
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: {
                "REACT_APP_API_BASE_URL": `https://${props.apiDomain}`,
                "REACT_APP_OAUTH_URL": `https://${props.authDomain}`,
                "NODE_OPTIONS": "--max-old-space-size=8192"
            },
            sourceCodeProvider: webAppCode
        });

        const mainBranch: Branch = this.app.addBranch('main', {
            autoBuild: false,
            branchName: "main",
            stage: "PRODUCTION"
        });
        this.branches["main"] = mainBranch;
        const devBranch: Branch = this.app.addBranch('dev', {
            autoBuild: false,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT"
        });
        this.branches["dev"] = devBranch;

        // fixme migration
        this.domain = this.app.addDomain('domain', {
            domainName: WEBAPP_DOMAIN,
            subDomains: [
                {branch: devBranch, prefix: "develop"},
                {branch: mainBranch, prefix: "main"}
            ]
        });
    }
}

export class OpenApiWebsite extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id, props);

        this.app = new App(this, 'app', {
            appName: "wasedatime-openapi",
            autoBranchDeletion: true,
            buildSpec: openapiBuildSpec,
            description: "API documentation website for WasedaTime.",
            sourceCodeProvider: apiDocCode
        });

        const mainBranch: Branch = this.app.addBranch('main', {
            autoBuild: true,
            branchName: "main",
            stage: "PRODUCTION",
            basicAuth: developerAuth
        });
        this.branches["main"] = mainBranch;

        this.domain = this.app.addDomain('domain', {
            domainName: "openapi." + WEBAPP_DOMAIN,
            subDomains: [
                {branch: mainBranch}
            ]
        });
    }
}