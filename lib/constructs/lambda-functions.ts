import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AwsServicePrincipal} from "../configs/aws";


export class CourseReviewsFunctions extends cdk.Stack {

    private readonly postFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const dynamoDBCrudRole = new LazyRole(this, 'dynamo-crud-role', {
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

    getFunctionByMethod(method: string): Function {
        switch (method) {
            case 'POST':
                return this.postFunction;
            default:
                throw new RangeError("No lambda handler is available on this method.");
        }
    }
}

export class SyllabusScraper extends cdk.Stack {

    private readonly baseFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaBasicRole = new LazyRole(this, 'lambda-base-exec-role', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.LAMBDA),
            description: "Lambda basic execution role.",
            path: `/aws-service-role/${AwsServicePrincipal.LAMBDA}/`,
            roleName: "lambda-basic-execute"
        });

        this.baseFunction = new Function(this, 'base-function', {
            code: Code.fromAsset('src/lambda/syllabus-scraper'),
            handler: "syllabus_scraper.handler",
            deadLetterQueueEnabled: false,
            description: "Base function for scraping syllabus data from Waseda University.",
            functionName: "scrape-syllabus",
            logRetention: RetentionDays.SIX_MONTHS,
            logRetentionRole: undefined,
            memorySize: 128,
            role: lambdaBasicRole,
            runtime: Runtime.PYTHON_3_8,
            timeout: Duration.seconds(3),
        });
    }

    getBaseFunction() {
        return this.baseFunction;
    }
}