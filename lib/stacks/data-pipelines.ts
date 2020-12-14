import * as cdk from '@aws-cdk/core';
import {RemovalPolicy} from '@aws-cdk/core';
import {Bucket, BucketAccessControl, BucketEncryption} from '@aws-cdk/aws-s3';
import {prodCorsRule, publicAccess} from "../configs/s3-bucket";
import {IStateMachine, StateMachine} from "@aws-cdk/aws-stepfunctions";

export class SyllabusDataPipeline extends cdk.Stack {
    private readonly syllabusBucket: Bucket;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.syllabusBucket = new Bucket(this, 's3-bucket-syllabus', {
            accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: publicAccess,
            bucketName: "wasedatime-syllabus-prod",
            cors: prodCorsRule,
            encryption: BucketEncryption.S3_MANAGED,
            publicReadAccess: true,
            removalPolicy: RemovalPolicy.DESTROY,
            versioned: true
        });
        const syllabusScraper: IStateMachine = StateMachine.fromStateMachineArn(this,
            'syllabus-scraper',
            'arn:aws:states:ap-northeast-1:564383102056:stateMachine:SyllabusScraperSerial'
        );
    }

    getData(): Bucket {
        return this.syllabusBucket;
    }
}