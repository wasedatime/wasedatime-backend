import * as cdk from '@aws-cdk/core';
import {Construct, RemovalPolicy} from '@aws-cdk/core';
import {Bucket, BucketAccessControl, BucketEncryption} from '@aws-cdk/aws-s3';
import {StateMachine, TaskInput} from "@aws-cdk/aws-stepfunctions";
import {LambdaInvocationType, LambdaInvoke} from "@aws-cdk/aws-stepfunctions-tasks";
import {Function} from "@aws-cdk/aws-lambda";
import {Effect, LazyRole, Policy, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {Table} from "@aws-cdk/aws-dynamodb";

import {publicAccess} from "../configs/s3/access-setting";
import {AwsServicePrincipal} from "../configs/aws";
import {SyllabusScraper} from "./lambda-functions";
import {prodCorsRule} from "../configs/s3/cors";


export enum Worker {

    SYLLABUS,

    CAREER,

    FEEDS
}

export interface DataPipelineProps {

    dataWarehouse?: Table;
}

export abstract class AbstractDataPipeline extends Construct {

    abstract dataSource?: Bucket;

    abstract processor: Function | StateMachine;

    abstract dataWarehouse: Bucket | Table;
}

export class SyllabusDataPipeline extends AbstractDataPipeline {

    readonly dataSource?: Bucket;

    readonly processor: StateMachine;

    readonly dataWarehouse: Bucket;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataWarehouse = new Bucket(this, 'syllabus-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: publicAccess,
            bucketName: "wasedatime-syllabus-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });

        const scraperBaseFunction: Function =
            new SyllabusScraper(this, 'scraper-base-function').baseFunction;

        function getLambdaTaskInstance(constructContext: cdk.Construct, schools: string[], num: string): LambdaInvoke {
            return new LambdaInvoke(scope, "task-" + num, {
                lambdaFunction: scraperBaseFunction,
                comment: "Scrape the syllabus info of school(s).",
                invocationType: LambdaInvocationType.REQUEST_RESPONSE,
                payload: TaskInput.fromObject({schools: schools}),
                qualifier: scraperBaseFunction.latestVersion.version
            });
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
        this.processor = new StateMachine(this, 'state-machine', {
            definition: getLambdaTaskInstance(this, ["GEC"], "0")
                .next(getLambdaTaskInstance(this, ["CMS", "HSS"], "1"))
                .next(getLambdaTaskInstance(this, ["EDU", "FSE"], "2"))
                .next(getLambdaTaskInstance(this, ["ASE", "CSE"], "3"))
                .next(getLambdaTaskInstance(this, ["PSE", "G_ASE", "LAW"], "4"))
                .next(getLambdaTaskInstance(this, ["G_FSE", "SOC", "SSS"], "5"))
                .next(getLambdaTaskInstance(this, ["G_LAS", "G_CSE", "G_EDU", "HUM"], "6"))
                .next(getLambdaTaskInstance(this, ["SILS", "G_HUM", "CJL", "SPS", "G_WBS", "G_PS"], "7"))
                .next(getLambdaTaskInstance(this, ["G_SPS", "G_IPS", "G_WLS", "G_E", "G_SSS", "G_SC", "G_LAW",
                    "G_SAPS", "G_SA", "G_SJAL", "G_SICCS", "G_SEEE", "EHUM", "ART", "CIE", "G_ITS"], "8"))
        });
    }
}

//todo add s3 deployment and notifications

export class CareerDataPipeline extends AbstractDataPipeline {
    readonly dataSource?: Bucket;

    readonly processor: Function;

    readonly dataWarehouse: Table;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataSource = new Bucket(this, 'career-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: publicAccess,
            bucketName: "wasedatime-career-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });
    }
}

export class FeedsDataPipeline extends AbstractDataPipeline {

    readonly dataSource?: Bucket;

    readonly processor: Function;

    readonly dataWarehouse: Table;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataSource = new Bucket(this, 'feeds-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: publicAccess,
            bucketName: "wasedatime-feeds-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });
    }
}