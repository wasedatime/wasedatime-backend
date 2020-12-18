import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {LazyRole, ManagedPolicy, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../configs/aws";


export class CourseReviewsFunctions extends cdk.Construct {

    readonly postFunction: Function;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const dynamoDBCrudRole: LazyRole = new LazyRole(this, 'dynamo-crud-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Allow lambda function to perform crud operation on dynamodb",
            path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "lambda-dynamodb-crud",
            managedPolicies: [
                ManagedPolicy.fromManagedPolicyArn(this, 'basic-exec',
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                ManagedPolicy.fromManagedPolicyArn(this, 'db-read-only',
                    "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess")
            ]
        });

        this.postFunction = new Function(this, 'get-reviews', {
            code: Code.fromAsset('src/lambda/get-reviews/function.zip'),
            handler: "get_reviews.handler",
            deadLetterQueueEnabled: false,
            description: "Get course reviews from database.",
            functionName: "get-reviews",
            logRetention: RetentionDays.ONE_MONTH,
            logRetentionRole: dynamoDBCrudRole,
            memorySize: 128,
            role: dynamoDBCrudRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
        });
    }
}

export class SyllabusScraper extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/syllabus-scraper/function.zip'),
            handler: "syllabus_scraper.handler",
            deadLetterQueueEnabled: false,
            description: "Base function for scraping syllabus data from Waseda University.",
            functionName: "syllabus-scraper",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
        });
    }
}

export class slackWebhookPublisher extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/slack-webhook-publisher/function.zip'),
            handler: "syllabus_scraper.handler",
            deadLetterQueueEnabled: false,
            description: "Forwards message from SNS to slack webhook.",
            functionName: "slack-webhook-publisher",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(3),
        });
    }
}