import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {IRuleTarget, Rule, RuleTargetInput} from "@aws-cdk/aws-events";
import {ITopic, Topic} from "@aws-cdk/aws-sns";
import {SnsTopic} from "@aws-cdk/aws-events-targets";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";

import {AmplifyStatusPublisher, ScraperStatusPublisher} from "../common/lambda-functions";
import {AMPLIFY_MESSAGE, SFN_MESSAGE} from "../../configs/event/message";


export enum StatusNotifier {
    BUILD_STATUS,
    SCRAPER_STATUS,
    CFN_STATUS
}

export interface StatusNotifierProps {

    target?: string;
}

export abstract class AbstractStatusNotifier extends Construct {

    abstract readonly rules: { [eventName: string]: Rule };

    abstract readonly target?: IRuleTarget | string;

    abstract readonly topic: ITopic;

    protected constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id);
    }
}

export class AmplifyBuildStatusNotifier extends AbstractStatusNotifier {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target?: string;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'build-status-topic', {
            topicName: "amplify-build-status"
        });
        const subscriber = new AmplifyStatusPublisher(this, 'subscriber-function').baseFunction;
        this.topic.addSubscription(new LambdaSubscription(subscriber));

        this.rules["on-build"] = new Rule(this, 'build-sentinel', {
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

        this.rules["on-build"].addTarget(new SnsTopic(this.topic, {
            message: RuleTargetInput.fromText(AMPLIFY_MESSAGE)
        }));
    }
}

export class SyllabusScraperStatusNotifier extends AbstractStatusNotifier {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target?: string;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'scraper-status-topic', {
            topicName: "scraper-task-status"
        });
        const subscriber = new ScraperStatusPublisher(this, 'subscriber-function').baseFunction;
        this.topic.addSubscription(new LambdaSubscription(subscriber));

        this.rules["task-status"] = new Rule(this, 'scraper-status', {
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

        this.rules["task-status"].addTarget(new SnsTopic(this.topic, {
            message: RuleTargetInput.fromText(SFN_MESSAGE)
        }));
    }
}
