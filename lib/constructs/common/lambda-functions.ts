import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Alias, Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {LazyRole, ManagedPolicy, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../../configs/common/aws";
import {GOOGLE_API_SERVICE_ACCOUNT_INFO, SLACK_WEBHOOK_URL} from "../../configs/lambda/environment";
import {PythonFunction} from "@aws-cdk/aws-lambda-python";


interface FunctionsProps {
    envvars: { [name: string]: string }
}

export class CourseReviewsFunctions extends cdk.Construct {

    readonly getFunction: Function;

    readonly postFunction: Function;

    readonly patchFunction: Function;

    readonly deleteFunction: Function;

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
            code: Code.fromAsset('src/lambda/get-reviews'),
            handler: "index.handler",
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

        this.postFunction = new PythonFunction(this, 'post-review', {
            entry: 'src/lambda/post-review',
            deadLetterQueueEnabled: false,
            description: "Save course reviews into the database.",
            functionName: "post-course-review",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBPutRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(5),
            environment: props.envvars
        }).addEnvironment("GOOGLE_API_SERVICE_ACCOUNT_INFO", GOOGLE_API_SERVICE_ACCOUNT_INFO);

        this.patchFunction = new PythonFunction(this, 'patch-review', {
            entry: 'src/lambda/patch-review',
            deadLetterQueueEnabled: false,
            description: "Update course reviews in the database.",
            functionName: "patch-course-review",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBPutRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(5),
            environment: props.envvars
        }).addEnvironment("GOOGLE_API_SERVICE_ACCOUNT_INFO", GOOGLE_API_SERVICE_ACCOUNT_INFO);

        this.deleteFunction = new PythonFunction(this, 'delete-review', {
            entry: 'src/lambda/delete-review',
            deadLetterQueueEnabled: false,
            description: "Delete course reviews in the database.",
            functionName: "delete-course-review",
            logRetention: RetentionDays.ONE_MONTH,
            memorySize: 128,
            role: dynamoDBPutRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
            environment: props.envvars
        });
    }

    deploy(func: Function) {
        let devVer = func.currentVersion;
        let prodVer = func.currentVersion;
        new Alias(this, 'alias-dev', {
            aliasName: 'dev',
            version: devVer,
            description: "Develop stage"
        });
        new Alias(this, 'alias-prod', {
            aliasName: 'prod',
            version: prodVer,
            description: "Production stage"
        });
        return this;
    }
}

export class SyllabusScraper extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props: FunctionsProps) {
        super(scope, id);

        this.baseFunction = new PythonFunction(this, 'base-function', {
            entry: 'src/lambda/syllabus-scraper',
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
            code: Code.fromAsset('src/lambda/amplify-status-publisher'),
            handler: "index.handler",
            deadLetterQueueEnabled: false,
            description: "Forwards Amplify build status message from SNS to Slack Webhook.",
            functionName: "amplify-status-publisher",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(3)
        }).addEnvironment("SLACK_WEBHOOK_URL", SLACK_WEBHOOK_URL);
    }
}

export class ScraperStatusPublisher extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: FunctionsProps) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/sfn-status-publisher'),
            handler: "index.handler",
            deadLetterQueueEnabled: false,
            description: "Forwards scraper execution status message from SNS to Slack Webhook.",
            functionName: "scraper-status-publisher",
            logRetention: RetentionDays.SIX_MONTHS,
            memorySize: 128,
            runtime: Runtime.NODEJS_12_X,
            timeout: Duration.seconds(3)
        }).addEnvironment("SLACK_WEBHOOK_URL", SLACK_WEBHOOK_URL);
    }
}

export class PreSignupWasedaMailValidator extends cdk.Construct {

    readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: FunctionsProps) {
        super(scope, id);

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/signup-validator'),
            handler: "index.handler",
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