import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServiceInterface } from '../architecture/interfaces';
import { PresentationLayer } from '../architecture/layers';
import { FEEDS_DEPLOY_KEY } from '../configs/amplify/build-setting';
import { webappSiteRules } from '../configs/amplify/website';
import { OperationEndpoint, ServiceEndpoint } from '../configs/common/registry';
import {
  AbstractWebApp,
  AmplifyMonoWebApp,
} from '../constructs/presentation/web-app';

export class WasedaTimePresentationLayer extends PresentationLayer {
  readonly app: AbstractWebApp;

  constructor(
    scope: Construct,
    id: string,
    serviceInterface: ServiceInterface,
    props?: StackProps,
  ) {
    super(scope, id, serviceInterface, props);

    const monoApp = new AmplifyMonoWebApp(this, 'amplify-monorepo-web-app', {
      apiDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.API_REST),
      authDomain: this.serviceInterface.getEndpoint(ServiceEndpoint.AUTH),
    });
    monoApp.addMicroApp('syllabus');
    monoApp.addMicroApp('campus');
    monoApp.addMicroApp('feeds');
    monoApp.addMicroApp('forum');
    monoApp.addMicroApp('career');

    monoApp.microApps.feeds.addEnvironment('DEPLOY_KEY', FEEDS_DEPLOY_KEY);

    webappSiteRules.forEach((value) => monoApp.app.addCustomRule(value));

    this.app = monoApp;
    const appDomains = Object.entries(monoApp.microApps).reduce(function (
      result: { [key: string]: string },
      [key, value],
    ) {
      result[value.appId] = key.toUpperCase();
      return result;
    },
    {});

    this.operationInterface.setEndpoint(OperationEndpoint.APP, appDomains);
  }
}
