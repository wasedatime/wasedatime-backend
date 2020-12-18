import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {EventField, IRuleTarget, Rule, RuleTargetInput} from "@aws-cdk/aws-events";
import {Function} from "@aws-cdk/aws-lambda";
import {Topic} from "@aws-cdk/aws-sns";
import {SfnStateMachine, SnsTopic} from "@aws-cdk/aws-events-targets";
import {StateMachine} from "@aws-cdk/aws-stepfunctions";
import {Effect, LazyRole, Policy, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";

import {AwsServicePrincipal} from "../configs/aws";
import {syllabusSchedule} from "../configs/schedule";


export enum TaskManager {
    BUILD_STATUS,
    SCRAPER_TASK,
    SCRAPER_STATUS
}

export interface TaskManagerProps {

    target: string;
}

export abstract class AbstractTaskManager extends Construct {

    abstract rules: { [eventName: string]: Rule } = {};

    abstract target?: IRuleTarget | string;

    abstract topic: Topic;

    protected constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id);
    }

    // abstract addRules(ruleName: string): AbstractEventNotifier;
    //
    // abstract setTarget(target: Construct): void;
    //
    // abstract addSubscriber(subscriptionType: number, subscriber: any): AbstractEventNotifier;
}


export class SyllabusScraperTaskManger extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly topic: Topic;

    readonly target: SfnStateMachine;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'status-topic', {
            topicName: "syllabus-scraper-status"
        });

        const subscriber = Function.fromFunctionArn(this, 'slack-webhook-publisher',
            "arn:aws:lambda:ap-northeast-1:564383102056:function:lambda-publish-notification"
        );
        this.topic.addSubscription(new LambdaSubscription(subscriber));

        const stateMachineExecRole = new LazyRole(this, 'state-machine-execute-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.EVENT_BRIDGE),
            description: "Allows EventBridge to execute the state machine.",
            path: `/aws-service-role/${AwsServicePrincipal.EVENT_BRIDGE}/`,
            roleName: "stepfunctions-syllabus-scraper-execute"
        });
        stateMachineExecRole.attachInlinePolicy(new Policy(this, 'execute-policy', {
            policyName: "AWSEventBridgeInvokeStepFunction.",
            statements: [new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["states:StartExecution"],
                resources: [props.target]
            })]
        }));
        this.target = new SfnStateMachine(
            StateMachine.fromStateMachineArn(this, 'sfn-target', props.target), {role: stateMachineExecRole}
        );

        for (const name in syllabusSchedule) {
            if (syllabusSchedule.hasOwnProperty(name)) {
                this.rules[name] = new Rule(this, name, {
                    ruleName: name,
                    enabled: true,
                    schedule: syllabusSchedule[name],
                    targets: [this.target]
                });
            }
        }
    }
}

export class AmplifyBuildStatusNotifier extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target?: string;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'build-status-topic', {
            topicName: "amplify-build-status"
        });
        const subscriber = Function.fromFunctionArn(this, 'slack-webhook-publisher',
            "arn:aws:lambda:ap-northeast-1:564383102056:function:forwardAmplifyNotificationSlack"
        );
        this.topic.addSubscription(new LambdaSubscription(subscriber))

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
                    "appId": props.target,
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

export class SyllabusScraperStatusNotifier extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target?: string;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
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