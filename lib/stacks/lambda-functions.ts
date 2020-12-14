import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {ApiEndpoint} from "./restful-api";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import {RetentionDays} from "@aws-cdk/aws-logs";
import {ApiEventSource} from "@aws-cdk/aws-lambda-event-sources";
import {LazyRole, ServicePrincipal} from "@aws-cdk/aws-iam";

export class CourseReviewsFunctions extends cdk.Stack {
    constructor(scope: ApiEndpoint, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const dynamoDBCrudRole = new LazyRole(this, 'dynamo-crud-role', {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            description: "Allow lambda function to perform crud operation on dynamodb"
        })

        const getReviewsFunction = new Function(this, 'get-reviews', {
            code: Code.fromAsset('/resources/lambda/get-reviews.zip'),
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
        })
        getReviewsFunction.addEventSource(
            new ApiEventSource('POST', "/course-reviews", {})
        )
    }
}