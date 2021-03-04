import * as cdk from '@aws-cdk/core';
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import {Construct, RemovalPolicy} from '@aws-cdk/core';
import {BlockPublicAccess, Bucket, BucketAccessControl, BucketEncryption, IBucket} from '@aws-cdk/aws-s3';
import {StateMachine, Succeed, TaskInput} from "@aws-cdk/aws-stepfunctions";
import {LambdaInvocationType, LambdaInvoke} from "@aws-cdk/aws-stepfunctions-tasks";
import {Function} from "@aws-cdk/aws-lambda";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import {Rule} from "@aws-cdk/aws-events";
import {SfnStateMachine} from "@aws-cdk/aws-events-targets";
import {AwsCustomResource,PhysicalResourceId,AwsCustomResourcePolicy} from "@aws-cdk/custom-resources";

import {SyllabusScraper, SyllabusUpdateFunction} from "../common/lambda-functions";
import {SyllabusFunctions} from "../common/lambda-functions";
import {prodCorsRule} from "../../configs/s3/cors";
import {syllabusSchedule} from "../../configs/event/schedule";
import {allowApiGatewayPolicy, allowLambdaPolicy} from "../../utils/s3";


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

    abstract readonly dataSource?: Bucket | IBucket;

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

        //todo use reduce
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
            if (syllabusSchedule.hasOwnProperty(name)) {
                this.schedules[name] = new Rule(this, name, {
                    ruleName: name,
                    enabled: true,
                    schedule: syllabusSchedule[name],
                    targets: [new SfnStateMachine(this.processor)],
                });
            }
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

    readonly dataSource?: Bucket;

    readonly processor: Function;

    readonly dataWarehouse: Table;

    constructor(scope: cdk.Construct, id: string, props?: DataPipelineProps) {
        super(scope, id);

        this.dataSource = new Bucket(this, 'feeds-bucket', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            bucketName: "wasedatime-feeds-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.RETAIN,
            versioned: true,
        });
    }
}

// todo sync syllabus on notification
export class SyllabusSyncPipeline extends AbstractDataPipeline {

    readonly dataSource: IBucket;

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
        this.dataSource = s3.Bucket.fromBucketName(this,'syllabus-bucket',"wasedatime-syllabus-prod");

        this.processor = new SyllabusUpdateFunction(this,'syllabus-update-function',{
            envVars: {
                ["BUCKET_NAME"]: this.dataSource.bucketName,
                ["OBJECT_PATH"]: 'syllabus/',
            }}).updateFunction;
        
        /*
            Due to current limitations with CloudFormation and the way we implemented bucket notifications in the CDK,
            it is impossible to add bucket notifications on an imported bucket. So we need to use AwsCustomResource to
            add event notification.
        */
        const rsrc = new AwsCustomResource(this, 'S3NotificationResource', {
            onCreate: {
                service: 'S3',
                action: 'putBucketNotificationConfiguration',
                parameters: {
                    // This bucket must be in the same region you are deploying to
                    Bucket: this.dataSource.bucketName,
                    NotificationConfiguration: {
                        LambdaFunctionConfigurations: [
                            {
                                Events: ['s3:ObjectCreated:*'],
                                LambdaFunctionArn: this.processor.functionArn,
                                Filter: {
                                    Key: {
                                        FilterRules: [{ Name: 'prefix', Value: 'syllabus/' }]
                                    }
                                }
                            }
                        ]
                    }
                },
                    // Always update physical ID so function gets executed
                    physicalResourceId : PhysicalResourceId.of(id + Date.now().toString()),
                },
                policy: AwsCustomResourcePolicy.fromStatements([new iam.PolicyStatement({
                    // The actual function is PutBucketNotificationConfiguration.
                    // The "Action" for IAM policies is PutBucketNotification.
                    // https://docs.aws.amazon.com/AmazonS3/latest/dev/list_amazons3.html#amazons3-actions-as-permissions
                    actions: ["S3:PutBucketNotification"],
                    // allow this custom resource to modify this bucket
                    resources: [this.dataSource.bucketArn],
                })])
        });

        this.processor.addPermission('AllowS3Invocation', {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('s3.amazonaws.com'),
            sourceArn: this.dataSource.bucketArn
        });

        rsrc.node.addDependency(this.processor.permissionsNode.findChild('AllowS3Invocation'));
    }
}