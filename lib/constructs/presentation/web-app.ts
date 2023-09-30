import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { Construct } from 'constructs';
import {
  BIT_TOKEN,
  FEEDS_DEPLOY_KEY,
  MASTER_VITE_GA_ID,
  DEV_VITE_GA_ID,
  microAppBuildSpec,
  microAppDevBuildSpec,
} from '../../configs/amplify/build-setting';
import { webAppCode } from '../../configs/amplify/codebase';
import { developerAuth } from '../../configs/amplify/website';
import { ROOT_DOMAIN, DEV_DOMAIN } from '../../configs/route53/domain';

export interface WebAppProps {
  apiDomain?: string;
  authDomain?: string;
}

export abstract class AbstractWebApp extends Construct {
  abstract readonly app: amplify.App;
  abstract readonly branches?: { [env: string]: amplify.Branch };
  abstract readonly domain?: amplify.Domain;

  protected constructor(scope: Construct, id: string, props: WebAppProps) {
    super(scope, id);
  }
}

export class AmplifyMonoWebApp extends AbstractWebApp {
  readonly app: amplify.App;
  readonly branches: { [key: string]: amplify.Branch } = {};
  readonly domain: amplify.Domain;
  readonly microApps: { [key: string]: amplify.App } = {};

  private readonly appProps: WebAppProps;

  constructor(scope: Construct, id: string, props: WebAppProps) {
    super(scope, id, props);

    const missingVars = [];

    if (!MASTER_VITE_GA_ID) missingVars.push('MASTER_VITE_GA_ID');
    if (!DEV_VITE_GA_ID) missingVars.push('DEV_VITE_GA_ID');

    if (missingVars.length > 0) {
      throw new Error(
        `Required environment variables are missing: ${missingVars.join(', ')}`,
      );
    }

    this.appProps = props;

    this.app = new amplify.App(this, 'root-app', {
      appName: 'wasedatime-web-root',
      autoBranchDeletion: false,
      buildSpec: microAppBuildSpec('root'),
      description:
        'A web app aiming to provide better campus life at Waseda University.',
      environmentVariables: {
        REACT_APP_API_BASE_URL: `https://${props.apiDomain}/v1`,
        REACT_APP_OAUTH_URL: `https://${props.authDomain}`,
        NODE_OPTIONS: '--max-old-space-size=8192',
        BIT_TOKEN: BIT_TOKEN,
        DEPLOY_KEY: FEEDS_DEPLOY_KEY,
      },
      sourceCodeProvider: webAppCode,
      autoBranchCreation: {
        autoBuild: true,
        patterns: ['release/*'],
        basicAuth: developerAuth,
        pullRequestPreview: false,
        buildSpec: microAppDevBuildSpec('root'),
      },
    });
    this.microApps.root = this.app;

    const masterBranch = this.app
      .addBranch('master', {
        autoBuild: false,
        branchName: 'master',
        stage: 'PRODUCTION',
        buildSpec: microAppBuildSpec('root'),
      })
      .addEnvironment('REACT_APP_API_BASE_URL', `https://${props.apiDomain}/v1`)
      .addEnvironment('VITE_API_BASE_URL', `https://${props.apiDomain}/v1`)
      .addEnvironment('VITE_GA_ID', MASTER_VITE_GA_ID)
      .addEnvironment('VITE_MF_HOME_BASE_PATH', `https://${ROOT_DOMAIN}`);
    this.branches.main = masterBranch;

    const devBranch = this.app
      .addBranch('dev', {
        autoBuild: false,
        basicAuth: developerAuth,
        branchName: 'develop',
        stage: 'DEVELOPMENT',
        buildSpec: microAppDevBuildSpec('root'),
      })
      .addEnvironment(
        'REACT_APP_API_BASE_URL',
        `https://${props.apiDomain}/staging`,
      )
      .addEnvironment('VITE_API_BASE_URL', `https://${props.apiDomain}/staging`)
      .addEnvironment('VITE_GA_ID', DEV_VITE_GA_ID)
      .addEnvironment('VITE_MF_HOME_BASE_PATH', `https://${DEV_DOMAIN}`);
    this.branches.dev = devBranch;

    this.domain = this.app.addDomain('domain', {
      domainName: ROOT_DOMAIN,
      subDomains: [
        { branch: devBranch, prefix: 'dev' },
        { branch: masterBranch, prefix: '' },
        { branch: masterBranch, prefix: 'www' },
      ],
    });
  }

  public addMicroApp(name: string) {
    const microApp = new amplify.App(this, `${name}-app`, {
      appName: `wasedatime-web-${name}`,
      autoBranchDeletion: false,
      buildSpec: microAppBuildSpec(name),
      environmentVariables: {
        REACT_APP_API_BASE_URL: `https://${this.appProps.apiDomain}/v1`,
        VITE_API_BASE_URL: `https://${this.appProps.apiDomain}/v1`,
        REACT_APP_OAUTH_URL: `https://${this.appProps.authDomain}`,
        NODE_OPTIONS: '--max-old-space-size=8192',
        BIT_TOKEN: BIT_TOKEN,
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

    microApp
      .addBranch('master', {
        autoBuild: false,
        branchName: 'master',
        stage: 'PRODUCTION',
        buildSpec: microAppBuildSpec(name),
      })
      .addEnvironment(
        'REACT_APP_API_BASE_URL',
        `https://${this.appProps.apiDomain}/v1`,
      )
      .addEnvironment(
        'VITE_API_BASE_URL',
        `https://${this.appProps.apiDomain}/v1`,
      )
      .addEnvironment('VITE_GA_ID', MASTER_VITE_GA_ID)
      .addEnvironment(
        'VITE_PUBLIC_BASE_PATH',
        `https://wasedatime.com/${name}`,
      );

    const appDomain = this.microApps[name].defaultDomain;
    microApp
      .addBranch('dev', {
        autoBuild: false,
        branchName: 'develop',
        stage: 'DEVELOPMENT',
        buildSpec: microAppDevBuildSpec(name),
      })
      .addEnvironment(
        'REACT_APP_API_BASE_URL',
        `https://${this.appProps.apiDomain}/staging`,
      )
      .addEnvironment(
        'VITE_API_BASE_URL',
        `https://${this.appProps.apiDomain}/staging`,
      )
      .addEnvironment('VITE_GA_ID', DEV_VITE_GA_ID)
      .addEnvironment('VITE_PUBLIC_BASE_PATH', `https://develop.${appDomain}`);

    this.app.addCustomRule(
      new amplify.CustomRule({
        source: `/${name}/<*>`,
        target: `https://master.${appDomain}/<*>`,
        status: amplify.RedirectStatus.REWRITE,
      }),
    );
    this.branches.dev.addEnvironment(
      `VITE_MF_${name.toUpperCase()}_BASE_PATH`,
      `https://develop.${appDomain}`,
    );

    this.branches.main.addEnvironment(
      `VITE_MF_${name.toUpperCase()}_BASE_PATH`,
      `https://wasedatime.com/${name}`,
    );
  }
}

//
