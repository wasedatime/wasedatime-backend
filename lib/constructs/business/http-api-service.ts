import * as apigw2 from '@aws-cdk/aws-apigatewayv2-alpha';
import { Construct } from 'constructs';

import { AbstractHttpApiEndpoint } from './api-endpoint';

export interface HttpApiServiceProps {
  apiEndpoint: apigw2.HttpApi;
  dataSource?: string;
  authorizer?: apigw2.HttpAuthorizer;
}

export abstract class AbstractHttpApiService extends Construct {
  abstract readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw2.HttpRoute } };

  protected constructor(scope: AbstractHttpApiEndpoint, id: string, props: HttpApiServiceProps) {
    super(scope, id);
  }
}
