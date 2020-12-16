import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../configs/aws";


export class CourseReviewsFunctions extends cdk.Construct {

    readonly postFunction: Function;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const dynamoDBCrudRole: LazyRole = new LazyRole(this, 'dynamo-crud-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Allow lambda function to perform crud operation on dynamodb",
            path: `/aws-service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "lambda-dynamodb-crud"
        });

        this.postFunction = new Function(this, 'get-reviews', {
            code: Code.fromAsset('src/lambda/get-reviews'),
            handler: "get_reviews.handler",
            deadLetterQueueEnabled: false,
            description: "Get course reviews from database.",
            functionName: "get-reviews",
            logRetention: RetentionDays.ONE_MONTH,
            logRetentionRole: undefined,
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

        // todo add policy
        const lambdaBasicRole: LazyRole = new LazyRole(this, 'lambda-base-exec-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Lambda basic execution role.",
            path: `/aws-service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "lambda-basic-execution"
        });

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/syllabus-scraper'),
            handler: "syllabus_scraper.handler",
            deadLetterQueueEnabled: false,
            description: "Base function for scraping syllabus data from Waseda University.",
            functionName: "syllabus-scraper",
            logRetention: RetentionDays.SIX_MONTHS,
            logRetentionRole: undefined,
            memorySize: 128,
            role: lambdaBasicRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
        });
    }
}

export class slackWebhookPublisher extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        // todo add policy
        const lambdaBasicRole: LazyRole = new LazyRole(this, 'lambda-base-exec-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Lambda basic execution role.",
            path: `/aws-service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "lambda-basic-execution"
        });

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/slack-webhook-publisher'),
            handler: "syllabus_scraper.handler",
            deadLetterQueueEnabled: false,
            description: "Forwards message from SNS to slack webhook.",
            functionName: "slack-webhook-publisher",
            logRetention: RetentionDays.SIX_MONTHS,
            logRetentionRole: undefined,
            memorySize: 128,
            role: lambdaBasicRole,
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(3),
        });
    }
}