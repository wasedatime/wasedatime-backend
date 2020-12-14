import * as cdk from "@aws-cdk/core";
import {RemovalPolicy} from "@aws-cdk/core";
import {EndpointType, Integration, IntegrationType, IResource, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {allowHeaders, allowOrigins, courseReviewReqSchema, syllabusSchema} from "../configs/api";
import {Bucket} from "@aws-cdk/aws-s3";
import {SyllabusDataPipeline} from "./data-pipelines";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import {awsEnv} from "../configs/aws";

export class ApiEndpoint extends cdk.Stack {

    private apiEndpoint: RestApi;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-api-dev",
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: false
        });

        this.apiEndpoint.addModel('syllabus-model', {
            schema: syllabusSchema,
            contentType: "application/json",
            description: "The new syllabus JSON schema for each school.",
            modelName: "Syllabus"
        });
        this.apiEndpoint.addModel('course-reviews-req-model', {
            schema: courseReviewReqSchema,
            contentType: "application/json",
            description: "HTTP POST request body schema for fetching reviews for several courses",
            modelName: "ReviewsReq"
        });

        // todo add stage & deployment strategy

        new SyllabusApi(this, 'syllabus-api', awsEnv);
    }

    getApiEndpoint(): IResource {
        return this.apiEndpoint.root;
    }
}

export class SyllabusApi extends cdk.Stack {

    constructor(scope: ApiEndpoint, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const syllabusBucket: Bucket = new SyllabusDataPipeline(scope, 'syllabus-datapipeline', awsEnv).getData();

        const syllabus: Resource = new Resource(scope, 'syllabus', {
            parent: scope.getApiEndpoint(),
            pathPart: "syllabus"
        });

        const syllabusSchools: Resource = new Resource(scope, 'school', {
            parent: syllabus,
            pathPart: "{school}"
        });
        syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: ['GET', 'OPTIONS'],
        });
        syllabusSchools.addMethod('GET', new Integration({
            type: IntegrationType.HTTP,
            integrationHttpMethod: 'GET',
            uri: `https://${syllabusBucket.bucketRegionalDomainName}/syllabus/{school}.json`
        }), {
            apiKeyRequired: false,
        });
    }
}

export class CourseReviewApi extends cdk.Stack {

    constructor(scope: ApiEndpoint, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const CourseReviewTable: Table = new Table(this, 'dynamodb-review-table', {
            partitionKey: {name: "course_key", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            readCapacity: 5,
            removalPolicy: RemovalPolicy.DESTROY,
            sortKey: {name: "timestamp", type: AttributeType.STRING},
            tableName: "course-review",
            writeCapacity: 5
        });

        const courseReviews: Resource = new Resource(this, 'course-reviews', {
            parent: scope.getApiEndpoint(),
            pathPart: "course-reviews"
        });
        courseReviews.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: ['POST', 'OPTIONS'],
        });
        courseReviews.addMethod('POST', new Integration({
            type: IntegrationType.AWS,
            integrationHttpMethod: 'GET',
            uri: ``//todo
        }), {
            apiKeyRequired: false,
        });
    }
}