import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import {Bucket, BucketAccessControl, BucketEncryption} from '@aws-cdk/aws-s3';
import {Errors, State, StateMachine, TaskInput} from "@aws-cdk/aws-stepfunctions";
import {LambdaInvocationType, LambdaInvoke, SnsPublish} from "@aws-cdk/aws-stepfunctions-tasks";
import {Topic} from "@aws-cdk/aws-sns";
import {SyllabusScraper} from "../stacks/lambda-functions";
import {Function} from "@aws-cdk/aws-lambda";
import {Effect, LazyRole, Policy, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";

import {prodCorsRule, publicAccess} from "../configs/s3-bucket";
import {awsEnv, AwsServicePrincipal} from "../configs/aws";

// todo abstract datapipeline
export interface DataPipelineProps {

    readonly name: string;

    readonly description: string;

}

export class SyllabusDataPipeline extends cdk.Construct {

    private readonly bucket: Bucket;

    private readonly snsTopic: Topic;

    private readonly stateMachine: StateMachine;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.bucket = new Bucket(this, 'syllabus-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: publicAccess,
            bucketName: "wasedatime-syllabus-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });

        this.snsTopic = new Topic(this, 'status-topic', {
            topicName: "syllabus-scraper-status"
        });

        const errorState = new SnsPublish(this, 'fsm-error', {
            message: TaskInput.fromText(
                "States.Format('[ERROR] AWS Step Function: " +
                "An Error occurred when scraping the syllabus caused by: {}', $.Cause)",
            ),
            topic: this.snsTopic,
            comment: "Publish error caused by the execution to sns topic."
        });
        const startState: SnsPublish = new SnsPublish(this, 'fsm-start', {
            message: TaskInput.fromText("[INFO] AWS Step Function: Started scraping the syllabus."),
            topic: this.snsTopic,
            comment: "Publish info about the beginning of the execution to sns topic."
        });
        const endState: State = new SnsPublish(this, 'fsm-end', {
            message: TaskInput.fromText(
                "[INFO] AWS Step Function: Finished scraping the syllabus. " +
                "See https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1" +
                "#logStream:group=%252Faws%252Flambda%252Fscrape-syllabus for logs."
            ),
            topic: this.snsTopic,
            comment: "Publish info about the beginning of the execution to sns topic."
        });

        const scraperBaseFunction: Function =
            new SyllabusScraper(this, 'scraper-base-function', awsEnv).getBaseFunction();

        function getLambdaTaskInstance(constructContext: cdk.Construct, schools: string[]): State {
            const randint: string = Math.floor(Math.random() * (1000)).toString();
            return new LambdaInvoke(scope, "task-" + randint, {
                lambdaFunction: scraperBaseFunction,
                comment: "Scrape the syllabus info of school(s).",
                invocationType: LambdaInvocationType.REQUEST_RESPONSE,
                payload: TaskInput.fromObject({schools: schools}),
                qualifier: scraperBaseFunction.latestVersion.version
            }).addCatch(errorState, {errors: [Errors.ALL]});
        }

        const stateMachineRole: LazyRole = new LazyRole(this, 'state-machine-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.STEP_FUNCTIONS),
            description: "Allows State Machine to publish to SNS and invoke lambda functions.",
            path: `/aws-service-role/${AwsServicePrincipal.STEP_FUNCTIONS}/`,
            roleName: "stepfunctions-syllabus-scraper-execute"
        });
        stateMachineRole.attachInlinePolicy(new Policy(this, 'lambda-invoke-policy', {
            policyName: "lambda-invoke-policy",
            statements: [
                new PolicyStatement({
                    sid: "allow-lambda-invoke",
                    effect: Effect.ALLOW,
                    actions: ["lambda:InvokeFunction"],
                    resources: [scraperBaseFunction.functionArn]
                })
            ]
        }));
        stateMachineRole.attachInlinePolicy(new Policy(this, 'sns-publish-policy', {
            policyName: "sns-publish-policy",
            statements: [
                new PolicyStatement({
                    sid: "allow-sns-publish",
                    effect: Effect.ALLOW,
                    actions: ["sns:Publish"],
                    resources: [this.snsTopic.topicArn]
                })
            ]
        }));
        this.stateMachine = new StateMachine(this, 'state-machine', {
            definition: startState
                .next(getLambdaTaskInstance(this, ["GEC"]))
                .next(getLambdaTaskInstance(this, ["CMS", "HSS"]))
                .next(getLambdaTaskInstance(this, ["EDU", "FSE"]))
                .next(getLambdaTaskInstance(this, ["ASE", "CSE"]))
                .next(getLambdaTaskInstance(this, ["PSE", "G_ASE", "LAW"]))
                .next(getLambdaTaskInstance(this, ["G_FSE", "SOC", "SSS"]))
                .next(getLambdaTaskInstance(this, ["G_LAS", "G_CSE", "G_EDU", "HUM"]))
                .next(getLambdaTaskInstance(this, ["SILS", "G_HUM", "CJL", "SPS", "G_WBS", "G_PS"]))
                .next(getLambdaTaskInstance(this, ["G_SPS", "G_IPS", "G_WLS", "G_E", "G_SSS", "G_SC", "G_LAW",
                    "G_SAPS", "G_SA", "G_SJAL", "G_SICCS", "G_SEEE", "EHUM", "ART", "CIE", "G_ITS"]))
                .next(endState)
        });
    }

    getData(): Bucket {
        return this.bucket;
    }

    getSNSTopic(): Topic {
        return this.snsTopic;
    }

    getProcessor(): StateMachine {
        return this.stateMachine;
    }
}

//todo more pipelines

export class CareerDataPipeline {
}

export class FeedsDataPipeline {
}