import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import {Rule, Schedule} from "@aws-cdk/aws-events";
import {Function} from "@aws-cdk/aws-lambda";
import {Topic} from "@aws-cdk/aws-sns";
import {SfnStateMachine} from "@aws-cdk/aws-events-targets";
import {StateMachine} from "@aws-cdk/aws-stepfunctions";
import {Effect, LazyRole, Policy, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {App} from "@aws-cdk/aws-amplify";

import {AwsServicePrincipal} from "../configs/aws";


export interface TaskManagerProps {

}

export abstract class AbstractTaskManager extends Construct {

    abstract rules: { [eventName: string]: Rule };

    abstract eventHandler?: Function;

    abstract topic: Topic;

    protected constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id);
    }
}

export class SyllabusScraperStatusNotifier extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule };

    readonly eventHandler?: Function;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'status-topic', {
            topicName: "syllabus-scraper-status"
        });

        this.rules["regular"] = new Rule(this, 'regular', {
            description: "Execute the syllabus scraper every month.",
            enabled: true,
            schedule: Schedule.cron({
                minute: '0', hour: '16', day: '1', month: '*', year: '*'
            }),
            targets: []
        });
    }

    addTarget(stateMachine: StateMachine) {
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
                resources: [stateMachine.stateMachineArn]
            })]
        }));
        this.rules["regular"].addTarget(new SfnStateMachine(stateMachine, {
            role: stateMachineExecRole
        }));
    }
}

export class AmplifyBuildStatusNotifier extends AbstractTaskManager {

    readonly rules: { [eventName: string]: Rule };

    readonly eventHandler?: Function;

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, amplifyApp: App, props: TaskManagerProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'status-topic', {
            topicName: "amplify-build-status"
        });

        this.rules["on-build"] = new Rule(this, 'build-sentinel', {
            description: "Triggered on Amplify build",
            enabled: true,
            eventPattern: {
                detail: {
                    "appId": amplifyApp.appId,
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
    }
}