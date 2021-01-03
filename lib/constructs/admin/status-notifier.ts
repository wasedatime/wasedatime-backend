import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {Rule} from "@aws-cdk/aws-events";
import {Topic} from "@aws-cdk/aws-sns";
import {LambdaFunction} from "@aws-cdk/aws-events-targets";
import {Function} from '@aws-cdk/aws-lambda';

import {AmplifyStatusPublisher, ScraperStatusPublisher} from "../common/lambda-functions";


export enum StatusNotifier {
    BUILD_STATUS,
    SCRAPER_STATUS
}

export interface StatusNotifierProps {

    target?: string;
}

export abstract class AbstractStatusNotifier extends Construct {

    abstract readonly publisher: Rule;

    abstract readonly topic: Topic;

    abstract readonly subscriber: Function;

    protected constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id);
    }
}

export class AmplifyBuildStatusNotifier extends AbstractStatusNotifier {

    readonly publisher: Rule;

    readonly topic: Topic;

    readonly subscriber: Function;

    constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id, props);

        this.subscriber = new AmplifyStatusPublisher(this, 'subscriber-function').baseFunction;

        this.publisher = new Rule(this, 'build-sentinel', {
            ruleName: "amplify-build-event",
            description: "Triggered on Amplify build",
            enabled: true,
            eventPattern: {
                source: [
                    "aws.amplify"
                ],
                detailType: [
                    "Amplify Deployment Status Change"
                ],
                detail: {
                    "appId": [props.target],
                    "jobStatus": [
                        "SUCCEED",
                        "FAILED",
                        "STARTED"
                    ]
                }
            }
        });

        this.publisher.addTarget(new LambdaFunction(this.subscriber));
    }
}

export class SyllabusScraperStatusNotifier extends AbstractStatusNotifier {

    readonly publisher: Rule;

    readonly topic: Topic;

    readonly subscriber: Function;

    constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id, props);

        this.subscriber = new ScraperStatusPublisher(this, 'subscriber-function').baseFunction;

        this.publisher = new Rule(this, 'scraper-status', {
            ruleName: "scraper-exec-event",
            description: "Scraper Status",
            enabled: true,
            eventPattern: {
                source: [
                    "aws.states"
                ],
                detailType: [
                    "Step Functions Execution Status Change"
                ],
                detail: {
                    "status": [
                        "RUNNING",
                        "SUCCEEDED",
                        "FAILED",
                        "TIMED_OUT",
                        "ABORTED"
                    ],
                    "stateMachineArn": [props.target]
                }
            }
        });

        this.publisher.addTarget(new LambdaFunction(this.subscriber));
    }
}
