import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {EventField, IRuleTarget, Rule, RuleTargetInput, Schedule} from "@aws-cdk/aws-events";
import {Function} from "@aws-cdk/aws-lambda";
import {Topic} from "@aws-cdk/aws-sns";
import {SfnStateMachine, SnsTopic} from "@aws-cdk/aws-events-targets";
import {StateMachine} from "@aws-cdk/aws-stepfunctions";
import {Effect, LazyRole, Policy, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../configs/aws";
import {LambdaSubscription} from "@aws-cdk/aws-sns-subscriptions";


export enum SubscriptionType {
    EMAIL,
    LAMBDA,
    SMS,
    SQS,
    URL
}

export interface TaskManagerProps {

    target?: any;

    // topicName: string,
    //
    // rules: { [eventName: string]: Rule },

}

export abstract class AbstractTaskManager extends Construct {

    abstract rules: { [eventName: string]: Rule } = {};

    abstract target: IRuleTarget;

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

    target: SfnStateMachine;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'status-topic', {
            topicName: "syllabus-scraper-status"
        });

        const subscriber = Function.fromFunctionArn(this, 'slack-webhook-publisher',
            "arn:aws:lambda:ap-northeast-1:564383102056:function:lambda-publish-notification"
        );
        this.topic.addSubscription(new LambdaSubscription(subscriber));

        this.rules["regular"] = new Rule(this, 'regular', {
            description: "Execute the syllabus scraper every month.",
            enabled: true,
            schedule: Schedule.cron({
                minute: '0', hour: '16', day: '1', month: '*', year: '*'
            }),
            targets: []
        });
    }

    setTarget(target: StateMachine) {
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
                resources: [target.stateMachineArn]
            })]
        }));
        this.target = new SfnStateMachine(target, {role: stateMachineExecRole});

        this.rules["regular"].addTarget(this.target);
    }
}

export class AmplifyBuildStatusManager extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule } = {};

    readonly target: SfnStateMachine;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'status-topic', {
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
                detail: {
                    "appId": props.target,
                    "jobStatus": [
                        "SUCCEED",
                        "FAILED",
                        "STARTED"
                    ],
                    "detail-type": [
                        "Amplify Deployment Status Change"
                    ],
                    "source": [
                        "aws.amplify"
                    ]
                }
            }
        });

        const appId: string = EventField.fromPath("$.detail.appId");
        const branch: string = EventField.fromPath("$.detail.branchName");
        const jobStat: string = EventField.fromPath("$.detail.jobStatus")
        const jobId: string = EventField.fromPath("$.detail.jobId");
        const region: string = EventField.fromPath("$.region");
        const buildMessage: string = `
        Build notification from the AWS Amplify Console for app: https://${branch}.${appId}.amplifyapp.com/. 
        Your build status is ${jobStat}. 
        Go to https://console.aws.amazon.com/amplify/home?region=${region}#${appId}/${branch}/${jobId} 
        to view details on your build.
        `
        this.rules["on-build"].addTarget(new SnsTopic(this.topic, {
            message: RuleTargetInput.fromText(buildMessage)
        }));
    }
}