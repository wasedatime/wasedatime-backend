import * as cdk from "@aws-cdk/core";
import {App, Branch, CustomRule, Domain, RedirectStatus} from "@aws-cdk/aws-amplify";

import {developerAuth} from "../../configs/amplify/website";
import {microAppBuildSpec, microAppDevBuildSpec} from "../../configs/amplify/build-setting";
import {webAppCode} from "../../configs/amplify/codebase";
import {ROOT_DOMAIN} from "../../configs/route53/domain";


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

export class AmplifyMonoWebApp extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    readonly microApps: { [key: string]: App } = {};

    private readonly appProps: WebAppProps;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id, props);

        this.appProps = props;

        this.app = new App(this, 'root-app', {
            appName: "wasedatime-web-root",
            autoBranchDeletion: true,
            buildSpec: microAppBuildSpec("root"),
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: {
                "REACT_APP_API_BASE_URL": `https://${props.apiDomain}/v1`,
                "REACT_APP_OAUTH_URL": `https://${props.authDomain}`,
                "NODE_OPTIONS": "--max-old-space-size=8192",
            },
            sourceCodeProvider: webAppCode,
            autoBranchCreation: {
                autoBuild: true,
                patterns: ['release/*'],
                basicAuth: developerAuth,
                pullRequestPreview: false,
                buildSpec: microAppDevBuildSpec("root"),
            },
        });

        const masterBranch: Branch = this.app.addBranch('master', {
            autoBuild: true,
            branchName: "master",
            stage: "PRODUCTION",
            buildSpec: microAppBuildSpec("root"),
        }).addEnvironment("REACT_APP_API_BASE_URL", `https://${props.apiDomain}/v1`);
        this.branches["main"] = masterBranch;

        const devBranch: Branch = this.app.addBranch('dev', {
            autoBuild: true,
            basicAuth: developerAuth,
            branchName: "develop",
            stage: "DEVELOPMENT",
            buildSpec: microAppDevBuildSpec("root"),
        }).addEnvironment("REACT_APP_API_BASE_URL", `https://${props.apiDomain}/staging`);
        this.branches["dev"] = devBranch;

        this.domain = this.app.addDomain('domain', {
            domainName: ROOT_DOMAIN,
            subDomains: [
                {branch: devBranch, prefix: "dev"},
                {branch: masterBranch, prefix: ''},
                {branch: masterBranch, prefix: 'www'},
            ],
        });
    }

    public addMicroApp(name: string): AmplifyMonoWebApp {
        const microApp = new App(this, `${name}-app`, {
            appName: `wasedatime-web-${name}`,
            autoBranchDeletion: true,
            buildSpec: microAppBuildSpec(name),
            environmentVariables: {
                "REACT_APP_API_BASE_URL": `https://${this.appProps.apiDomain}/v1`,
                "REACT_APP_OAUTH_URL": `https://${this.appProps.authDomain}`,
                "NODE_OPTIONS": "--max-old-space-size=8192",
            },
            sourceCodeProvider: webAppCode,
            autoBranchCreation: {
                autoBuild: true,
                patterns: ['release/*'],
                basicAuth: developerAuth,
                pullRequestPreview: false,
                buildSpec: microAppDevBuildSpec(name),
            },
        });
        this.microApps[name] = microApp;

        microApp.addBranch('master', {
            autoBuild: true,
            branchName: "master",
            stage: "PRODUCTION",
            buildSpec: microAppBuildSpec(name),
        }).addEnvironment("REACT_APP_API_BASE_URL", `https://${this.appProps.apiDomain}/v1`);

        microApp.addBranch('dev', {
            autoBuild: true,
            branchName: "develop",
            stage: "DEVELOPMENT",
            buildSpec: microAppDevBuildSpec(name),
        }).addEnvironment("REACT_APP_API_BASE_URL", `https://${this.appProps.apiDomain}/staging`);

        const appDomain = this.microApps[name].defaultDomain;
        this.app.addCustomRule(new CustomRule({
            source: `/${name}/<*>`,
            target: `https://master.${appDomain}/<*>`,
            status: RedirectStatus.REWRITE,
        }));
        this.app.addEnvironment(`MF_${name.toUpperCase()}_DOMAIN`, appDomain);

        return this;
    }
}