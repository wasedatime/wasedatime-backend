import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { AmplifyStatusPublisher, ScraperStatusPublisher } from '../common/lambda-functions';

export enum StatusNotifier {
  BUILD_STATUS,
  SCRAPER_STATUS
}

export interface StatusNotifierProps {
  targets: { [key: string]: string };
}

export abstract class AbstractStatusNotifier extends Construct {
  abstract readonly publisher: events.Rule;
  abstract readonly topic?: sns.Topic;
  abstract readonly subscriber: lambda.Function;

  protected constructor(scope: Construct, id: string, props: StatusNotifierProps) {
    super(scope, id);
  }
}

export class AmplifyBuildStatusNotifier extends AbstractStatusNotifier {
  readonly publisher: events.Rule;
  readonly topic?: sns.Topic;
  readonly subscriber: lambda.Function;

  constructor(scope: Construct, id: string, props: StatusNotifierProps) {
    super(scope, id, props);

    const subscriber = new AmplifyStatusPublisher(this, 'subscriber-function').baseFunction;
    subscriber.addEnvironment('APP_ENDPOINTS', JSON.stringify(props.targets));
    this.subscriber = subscriber;

    this.publisher = new events.Rule(this, 'build-sentinel', {
      ruleName: 'amplify-build-event',
      description: 'Triggered on Amplify build',
      enabled: true,
      eventPattern: {
        source: [
          'aws.amplify',
        ],
        detailType: [
          'Amplify Deployment Status Change',
        ],
        detail: {
          appId: Object.keys(props.targets),
          jobStatus: [
            'SUCCEED',
            'FAILED',
            'STARTED',
          ],
        },
      },
    });

    this.publisher.addTarget(new events_targets.LambdaFunction(this.subscriber));
  }
}

export class SyllabusScraperStatusNotifier extends AbstractStatusNotifier {
  readonly publisher: events.Rule;
  readonly topic?: sns.Topic;
  readonly subscriber: lambda.Function;

  constructor(scope: Construct, id: string, props: StatusNotifierProps) {
    super(scope, id, props);

    this.subscriber = new ScraperStatusPublisher(this, 'subscriber-function').baseFunction;

    this.publisher = new events.Rule(this, 'scraper-status', {
      ruleName: 'scraper-exec-event',
      description: 'Scraper Status',
      enabled: true,
      eventPattern: {
        source: [
          'aws.states',
        ],
        detailType: [
          'Step Functions Execution Status Change',
        ],
        detail: {
          status: [
            'RUNNING',
            'SUCCEEDED',
            'FAILED',
            'TIMED_OUT',
            'ABORTED',
          ],
          stateMachineArn: Object.keys(props.targets),
        },
      },
    });

    this.publisher.addTarget(new events_targets.LambdaFunction(this.subscriber));
  }
}
