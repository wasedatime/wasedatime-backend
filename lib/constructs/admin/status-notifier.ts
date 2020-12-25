import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {EventField, IRuleTarget, Rule, RuleTargetInput} from "@aws-cdk/aws-events";
import {Function} from "@aws-cdk/aws-lambda";
import {ITopic, Topic} from "@aws-cdk/aws-sns";
import {SnsTopic} from "@aws-cdk/aws-events-targets";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";

import {AmplifyStatusPublisher} from "../common/lambda-functions";
import {CF_NOTIF_FUNC_ARN, CF_TOPIC_ARN} from "../../configs/common/arn";


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

        const appId: string = EventField.fromPath("$.detail.appId");
        const branch: string = EventField.fromPath("$.detail.branchName");
        const jobStat: string = EventField.fromPath("$.detail.jobStatus");
        const jobId: string = EventField.fromPath("$.detail.jobId");
        const region: string = EventField.fromPath("$.region");
        const buildMessage: string = `
        Build notification from the AWS Amplify Console for app: https://${branch}.${appId}.amplifyapp.com/. 
        Your build status is ${jobStat}. 
        Go to https://${region}.console.aws.amazon.com/amplify/home?region=${region}#${appId}/${branch}/${jobId} 
        to view details on your build.`;

        this.rules["on-build"].addTarget(new SnsTopic(this.topic, {
            message: RuleTargetInput.fromText(buildMessage)
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
        const subscriber = Function.fromFunctionArn(this, 'slack-webhook-publisher',
            "arn:aws:lambda:ap-northeast-1:564383102056:function:lambda-publish-notification"
        );
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

        const execName: string = EventField.fromPath("$.detail.name");
        const execArn: string = EventField.fromPath("$.detail.executionArn");
        const jobStat: string = EventField.fromPath("$.detail.status");
        const region: string = EventField.fromPath("$.region");
        const taskMessage: string = `
        Task status notification from the AWS StepFunction for execution name: ${execName}. 
        The task status is ${jobStat}. 
        Go to https://${region}.console.aws.amazon.com/states/home?region=${region}#/executions/details/${execArn}
        to view details on the execution.`;

        this.rules["task-status"].addTarget(new SnsTopic(this.topic, {
            message: RuleTargetInput.fromText(taskMessage)
        }));
    }
}

//todo complete definition
export class StackStatusNotifier extends AbstractStatusNotifier {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target?: string;

    readonly topic: ITopic;

    constructor(scope: cdk.Construct, id: string, props: StatusNotifierProps) {
        super(scope, id, props);

        this.topic = Topic.fromTopicArn(this, 'stack-status-topic', CF_TOPIC_ARN);

        const subscriber = Function.fromFunctionArn(this, 'slack-webhook-publisher', CF_NOTIF_FUNC_ARN);
    }
}