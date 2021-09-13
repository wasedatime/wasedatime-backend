import * as cdk from '@aws-cdk/core';
import {Construct, RemovalPolicy} from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import {BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption} from "@aws-cdk/aws-s3";
import {StateMachine, Succeed, TaskInput} from "@aws-cdk/aws-stepfunctions";
import {LambdaInvocationType, LambdaInvoke} from "@aws-cdk/aws-stepfunctions-tasks";
import {Function} from "@aws-cdk/aws-lambda";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import {Rule} from "@aws-cdk/aws-events";
import {SfnStateMachine} from "@aws-cdk/aws-events-targets";

import {BlogUpdateFunction, SyllabusScraper, SyllabusUpdateFunction} from "../common/lambda-functions";
import {prodCorsRule} from "../../configs/s3/cors";
import {syllabusSchedule} from "../../configs/event/schedule";
import {allowApiGatewayPolicy, allowLambdaPolicy} from "../../utils/s3";
import {S3EventSource} from '@aws-cdk/aws-lambda-event-sources';


export enum Worker {

    SYLLABUS,

    CAREER,

    FEEDS
}

export interface DataPipelineProps {

    dataSource?: Bucket;

    dataWarehouse?: Table;
}

export abstract class AbstractDataPipeline extends Construct {

    abstract readonly dataSource?: Bucket;

    abstract readonly processor: Function | StateMachine;

    abstract readonly dataWarehouse: Bucket | Table;
}

export class SyllabusDataPipeline extends AbstractDataPipeline {

    readonly dataSource?: Bucket;

    readonly processor: StateMachine;

    readonly dataWarehouse: Bucket;

    readonly schedules: { [name: string]: Rule } = {};

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataWarehouse = new Bucket(this, 'syllabus-bucket', {
            accessControl: BucketAccessControl.PRIVATE,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: "wasedatime-syllabus-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: false,
            removalPolicy: RemovalPolicy.RETAIN,
            versioned: true,
        });
        allowApiGatewayPolicy(this.dataWarehouse);
        allowLambdaPolicy(this.dataWarehouse);

        const scraperBaseFunction: Function = new SyllabusScraper(this, 'scraper-base-function', {
            envVars: {
                ["BUCKET_NAME"]: this.dataWarehouse.bucketName,
                ["OBJECT_PATH"]: 'syllabus/',
            },
        }).baseFunction;

        function getLambdaTaskInstance(schools: string[], num: string): LambdaInvoke {
            return new LambdaInvoke(scope, "task-" + num, {
                lambdaFunction: scraperBaseFunction,
                comment: "Scrape the syllabus info of school(s).",
                invocationType: LambdaInvocationType.REQUEST_RESPONSE,
                payload: TaskInput.fromObject({schools: schools}),
                qualifier: scraperBaseFunction.latestVersion.version,
            });
        }

        // todo sync to table
        this.processor = new StateMachine(this, 'state-machine', {
            stateMachineName: 'syllabus-scraper',
            definition: getLambdaTaskInstance(["GEC"], "0")
                .next(getLambdaTaskInstance(["CMS", "HSS"], "1"))
                .next(getLambdaTaskInstance(["EDU", "FSE"], "2"))
                .next(getLambdaTaskInstance(["ASE", "CSE"], "3"))
                .next(getLambdaTaskInstance(["PSE", "G_ASE", "LAW"], "4"))
                .next(getLambdaTaskInstance(["G_FSE", "SOC", "SSS"], "5"))
                .next(getLambdaTaskInstance(["G_LAS", "G_CSE", "G_EDU", "HUM"], "6"))
                .next(getLambdaTaskInstance(["SILS", "G_HUM", "CJL", "SPS", "G_WBS", "G_PS"], "7"))
                .next(getLambdaTaskInstance(["G_SPS", "G_IPS", "G_WLS", "G_E", "G_SSS", "G_SC", "G_LAW",
                    "G_SAPS", "G_SA", "G_SJAL", "G_SICCS", "G_SEEE", "EHUM", "ART", "CIE", "G_ITS"], "8"))
                .next(new Succeed(this, 'success', {})),
        });

        for (const name in syllabusSchedule) {
            this.schedules[name] = new Rule(this, name, {
                    ruleName: name,
                    enabled: true,
                    schedule: syllabusSchedule[name],
                    targets: [new SfnStateMachine(this.processor)],
                },
            );
        }
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
            accessControl: BucketAccessControl.PRIVATE,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            bucketName: "wasedatime-career",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: false,
            removalPolicy: RemovalPolicy.RETAIN,
            versioned: false,
        });
    }
}

export class FeedsDataPipeline extends AbstractDataPipeline {

    readonly dataSource: Bucket;

    readonly processor: Function;

    readonly dataWarehouse: Table;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataWarehouse = props?.dataWarehouse!;

        this.dataSource = new Bucket(this, 'feeds-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            bucketName: "wasedatime-feeds",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.RETAIN,
            versioned: true,
        });

        this.processor = new BlogUpdateFunction(this, 'blog-update-function', {
            envVars: {
                ["BUCKET_NAME"]: this.dataSource.bucketName,
                ['TABLE_NAME']: this.dataWarehouse.tableName,
                ["OBJECT_PATH"]: 'blogs/',
            },
        }).updateFunction;

        this.processor.addEventSource(new S3EventSource(this.dataSource, {
            events: [s3.EventType.OBJECT_CREATED],
            filters: [{prefix: 'blogs/'}, {suffix: '.md'}],
        }));
    }
}

// sync syllabus on notification
export class SyllabusSyncPipeline extends AbstractDataPipeline {

    readonly dataSource: Bucket;

    readonly processor: Function;

    readonly dataWarehouse: Table;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataWarehouse = new Table(this, 'dynamodb-syllabus-table', {
            partitionKey: {name: "school", type: AttributeType.STRING},
            sortKey: {name: "id", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            timeToLiveAttribute: "ttl",
            tableName: "waseda-syllabus",
            readCapacity: 1,
            writeCapacity: 1,
        });
        //Use exsisting s3 bucket
        this.dataSource = props?.dataSource!;

        this.processor = new SyllabusUpdateFunction(this, 'syllabus-update-function', {
            envVars: {
                ["BUCKET_NAME"]: this.dataSource.bucketName,
                ['TABLE_NAME']: this.dataWarehouse.tableName,
                ["OBJECT_PATH"]: 'syllabus/',
            },
        }).updateFunction;

        this.processor.addEventSource(new S3EventSource(this.dataSource, {
            events: [s3.EventType.OBJECT_CREATED_PUT],
            filters: [{prefix: 'syllabus/'}],
        }));
    }
}