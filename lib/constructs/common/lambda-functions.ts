import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {LazyRole, ManagedPolicy, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../../configs/common/aws";
import {GOOGLE_API_KEY} from "../../configs/lambda/environment";

interface FunctionsProps {
    envvars: { [name: string]: string }
}

export class CourseReviewsFunctions extends cdk.Construct {

    readonly getFunction: Function;

    readonly postFunction: Function;

    readonly putFunction: Function;

    constructor(scope: cdk.Construct, id: string, props: FunctionsProps) {
        super(scope, id);

        const dynamoDBReadRole: LazyRole = new LazyRole(this, 'dynamo-read-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Allow lambda function to perform crud operation on dynamodb",
            path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "dynamodb-lambda-read",
            managedPolicies: [
                ManagedPolicy.fromManagedPolicyArn(this, 'basic-exec',
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                ManagedPolicy.fromManagedPolicyArn(this, 'db-read-only',
                    "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess")
            ]
        });

        const dynamoDBPutRole: LazyRole = new LazyRole(this, 'dynamo-put-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Allow lambda function to perform crud operation on dynamodb",
            path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "dynamodb-lambda-write",
            managedPolicies: [
                ManagedPolicy.fromManagedPolicyArn(this, 'basic-exec1',
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
                ManagedPolicy.fromManagedPolicyArn(this, 'db-full-access',
                    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess")
            ]
        });

        this.getFunction = new Function(this, 'get-reviews', {
            code: Code.fromAsset('src/lambda/get-reviews/function.zip'),
            handler: "get_reviews.handler",
            deadLetterQueueEnabled: false,
            description: "Get course reviews from the database.",
            functionName: "get-course-reviews",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBReadRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
            environment: props.envvars
        });

        this.postFunction = new Function(this, 'post-review', {
            code: Code.fromAsset('src/lambda/post-review/function.zip'),
            handler: "post_review.handler",
            deadLetterQueueEnabled: false,
            description: "Save course reviews into the database.",
            functionName: "post-course-review",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBPutRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(5),
            environment: props.envvars
        }).addEnvironment("GOOGLE_API_KEY", GOOGLE_API_KEY);

        this.putFunction = new Function(this, 'put-review', {
            code: Code.fromAsset('src/lambda/put-review/function.zip'),
            handler: "put_review.handler",
            deadLetterQueueEnabled: false,
            description: "Update course reviews in the database.",
            functionName: "put-course-review",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBPutRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(5),
            environment: props.envvars
        }).addEnvironment("GOOGLE_API_KEY", GOOGLE_API_KEY);
    }
}

export class SyllabusScraper extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props: FunctionsProps) {
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
            environment: props.envvars
        });
    }
}

export class AmplifyStatusPublisher extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: FunctionsProps) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/amplify-status-publisher/function.zip'),
            handler: "webhook_publisher.handler",
            deadLetterQueueEnabled: false,
            description: "Forwards amplify build status message from SNS to slack webhook.",
            functionName: "slack-webhook-publisher",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3)
        });
    }
}

export class PreSignupWasedaMailValidator extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: FunctionsProps) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/signup-validator/function.zip'),
            handler: "signup_validator.handler",
            deadLetterQueueEnabled: false,
            description: "Validates if the user is signing up using WasedaMail",
            functionName: "wasedamail-signup-validator",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3)
        });
    }
}