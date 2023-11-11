import { StackProps } from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { DataInterface } from '../architecture/interfaces';
import { BusinessLayer } from '../architecture/layers';
import { DataEndpoint, ServiceEndpoint } from '../configs/common/registry';
import {
  AbstractApiEndpoint,
  AbstractRestApiEndpoint,
  WasedaTimeRestApiEndpoint,
} from '../constructs/business/api-endpoint';
import {
  AbstractAuthProvider,
  WasedaTimeUserAuth,
} from '../constructs/business/authentication';

export class WasedaTimeBusinessLayer extends BusinessLayer {
  apiEndpoints: { [name: string]: AbstractApiEndpoint } = {};
  authProvider: AbstractAuthProvider;

  constructor(
    scope: Construct,
    id: string,
    dataInterface: DataInterface,
    hostedZone: route53.IHostedZone,
    props: StackProps,
  ) {
    super(scope, id, dataInterface, props);

    const authEndpoint = new WasedaTimeUserAuth(
      this,
      'cognito-endpoint',
      hostedZone,
    );
    this.authProvider = authEndpoint;

    const restApiEndpoint: AbstractRestApiEndpoint =
      new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
        zone: hostedZone,
        authProvider: authEndpoint.pool,
      });
    this.apiEndpoints['rest-api'] = restApiEndpoint;

    // const graphqlApiEndpoint: AbstractGraphqlEndpoint = new WasedaTimeGraphqlEndpoint(this, 'graphql-api-endpoint', {
    //     zone: hostedZone,
    //     authProvider: authEndpoint.pool,
    // });
    // this.apiEndpoints["graphql-api"] = graphqlApiEndpoint;
    //
    // graphqlApiEndpoint.addService("course", this.dataInterface.getEndpoint(DataEndpoint.COURSE));

    restApiEndpoint
      .addService(
        'syllabus',
        this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS),
      )
      .addService(
        'course-reviews',
        this.dataInterface.getEndpoint(DataEndpoint.COURSE_REVIEWS),
        true,
      )
      .addService(
        'career',
        this.dataInterface.getEndpoint(DataEndpoint.CAREER),
        true,
      )
      .addService(
        'timetable',
        this.dataInterface.getEndpoint(DataEndpoint.TIMETABLE),
        true,
      )
      .addService(
        'thread',
        this.dataInterface.getEndpoint(DataEndpoint.THREAD),
        true,
      )
      .addService(
        'comment',
        this.dataInterface.getEndpoint(DataEndpoint.COMMENT),
        true,
      )
      .addService(
        'ads',
        this.dataInterface.getEndpoint(DataEndpoint.ADS),
        true)
      .addService(
        'profile',
        this.dataInterface.getEndpoint(DataEndpoint.PROFILE),
        true,
      );
    // .addService("graphql", graphqlApiEndpoint.apiEndpoint.graphqlUrl);
    restApiEndpoint.deploy();

    this.serviceInterface.setEndpoint(
      ServiceEndpoint.API_REST,
      restApiEndpoint.getDomain(),
    );
    // this.serviceInterface.setEndpoint(ServiceEndpoint.API_GRAPHQL, graphqlApiEndpoint.getDomain());
    this.serviceInterface.setEndpoint(
      ServiceEndpoint.AUTH,
      authEndpoint.getDomain(),
    );
  }
}
