import * as cdk from "@aws-cdk/core";
import {App, Branch, Domain} from "@aws-cdk/aws-amplify";

import {developerAuth, webappSiteRules} from "../../configs/amplify/website";
import {
    microAppBuildSpec,
    microAppDevBuildSpec,
    rootAppBuildSpec,
    rootAppDevBuildSpec,
} from "../../configs/amplify/build-setting";
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

export class AmplifyWebApp extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id, props);

        this.app = new App(this, 'app', {
            appName: "wasedatime-web-app",
            autoBranchDeletion: true,
            buildSpec: rootAppBuildSpec,
            customRules: webappSiteRules,
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
                buildSpec: rootAppDevBuildSpec,
                environmentVariables: {
                    ["REACT_APP_API_BASE_URL"]: `https://${props.apiDomain}/staging`,
                },
            },
        });

        const masterBranch: Branch = this.app.addBranch('master', {
            autoBuild: true,
            branchName: "master",
            stage: "PRODUCTION",
            buildSpec: rootAppBuildSpec,
        }).addEnvironment("REACT_APP_API_BASE_URL", `https://${props.apiDomain}/v1`);

        this.branches["main"] = masterBranch;

        this.domain = this.app.addDomain('domain', {
            domainName: ROOT_DOMAIN,
            subDomains: [
                // {branch: devBranch, prefix: "dev"},
                {branch: masterBranch, prefix: ''},
                {branch: masterBranch, prefix: 'www'},
            ],
        });
    }
}

export class AmplifyMonoWebApp extends AbstractWebApp {

    readonly app: App;

    readonly branches: { [key: string]: Branch } = {};

    readonly domain: Domain;

    private appProps: WebAppProps;

    private defaultEnvVars: { [key: string]: string };

    constructor(scope: cdk.Construct, id: string, props: WebAppProps) {
        super(scope, id, props);

        this.appProps = props;
        this.defaultEnvVars = {
            "REACT_APP_API_BASE_URL": `https://${props.apiDomain}/v1`,
            "REACT_APP_OAUTH_URL": `https://${props.authDomain}`,
            "NODE_OPTIONS": "--max-old-space-size=8192",
        };

        this.app = new App(this, 'root-app', {
            appName: "wasedatime-web-root",
            autoBranchDeletion: true,
            buildSpec: microAppBuildSpec("root"),
            description: "A web app aiming to provide better campus life at Waseda University.",
            environmentVariables: this.defaultEnvVars,
            sourceCodeProvider: webAppCode,
            autoBranchCreation: {
                autoBuild: true,
                patterns: ['release/*'],
                basicAuth: developerAuth,
                pullRequestPreview: false,
                buildSpec: microAppDevBuildSpec("root"),
            },
        });

        // const masterBranch: Branch = this.app.addBranch('master', {
        //     autoBuild: true,
        //     branchName: "master",
        //     stage: "PRODUCTION",
        //     buildSpec: microAppBuildSpec("root"),
        // }).addEnvironment("REACT_APP_API_BASE_URL", `https://${props.apiDomain}/v1`);
        // this.branches["main"] = masterBranch;

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
                // {branch: masterBranch, prefix: ''},
                // {branch: masterBranch, prefix: 'master'},
            ],
        });
    }

    public addMicroApp(name: string): AmplifyMonoWebApp {
        const microApp = new App(this, `${name}-app`, {
            appName: `wasedatime-web-${name}`,
            autoBranchDeletion: true,
            buildSpec: microAppBuildSpec(name),
            environmentVariables: this.defaultEnvVars,
            sourceCodeProvider: webAppCode,
            autoBranchCreation: {
                autoBuild: true,
                patterns: ['release/*'],
                basicAuth: developerAuth,
                pullRequestPreview: false,
                buildSpec: microAppDevBuildSpec(name),
            },
        });

        // microApp.addBranch('master', {
        //     autoBuild: true,
        //     branchName: "master",
        //     stage: "PRODUCTION",
        //     buildSpec: microAppBuildSpec(name),
        // }).addEnvironment("REACT_APP_API_BASE_URL", `https://${this.appProps.apiDomain}/v1`);
        // this.app.addCustomRule(new CustomRule({
        //     source: `/${name}/<*>`,
        //     target: `https://master.${microApp.defaultDomain}/<*>`,
        //     status: RedirectStatus.REWRITE,
        // }));
        //
        // microApp.addBranch('dev', {
        //     autoBuild: true,
        //     branchName: "develop",
        //     stage: "DEVELOPMENT",
        //     buildSpec: microAppDevBuildSpec(name),
        // }).addEnvironment("REACT_APP_API_BASE_URL", `https://${this.appProps.apiDomain}/staging`);
        // this.app.addEnvironment(`MF_${name.toUpperCase()}_DOMAIN`, microApp.defaultDomain);

        return this;
    }
}