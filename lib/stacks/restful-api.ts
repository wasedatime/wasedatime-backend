import * as cdk from "@aws-cdk/core";
import {RemovalPolicy} from "@aws-cdk/core";
import {
    EndpointType,
    Integration,
    IntegrationType,
    IResource,
    LambdaIntegration,
    Method,
    Resource,
    RestApi,
    SecurityPolicy
} from '@aws-cdk/aws-apigateway';
import {Bucket} from "@aws-cdk/aws-s3";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import {Function} from "@aws-cdk/aws-lambda";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";

import {SyllabusDataPipeline} from "../constructs/data-pipelines";
import {awsEnv} from "../configs/aws";
import {allowHeaders, allowOrigins, courseReviewReqSchema, syllabusSchema} from "../configs/api";
import {WEBAPP_DOMAIN} from "../configs/website";
import {CourseReviewsFunctions} from "./lambda-functions";


export class ApiEndpoint extends cdk.Stack {

    private apiEndpoint: RestApi;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-api-dev",
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: false
        });

        const apiDomainCert = new Certificate(this, 'domain-certificate', {
            domainName: "api." + WEBAPP_DOMAIN,
            validation: CertificateValidation.fromEmail()
        });
        this.apiEndpoint.addDomainName('domain', {
            certificate: apiDomainCert,
            domainName: "api." + WEBAPP_DOMAIN,
            endpointType: EndpointType.REGIONAL,
            securityPolicy: SecurityPolicy.TLS_1_2
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

        const syllabusBucket: Bucket = new SyllabusDataPipeline(scope, 'syllabus-datapipeline', {
            name: "",
            description: ""
        }).getData();

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

//todo add model validation and method response options
export class CourseReviewApi extends cdk.Stack {

    private readonly dbTable: Table;

    private readonly resources: Resource;

    private readonly methods: { [key: string]: Method } = {}; // todo use enum

    constructor(scope: ApiEndpoint, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.dbTable = new Table(this, 'dynamodb-review-table', {
            partitionKey: {name: "course_key", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            readCapacity: 5,
            removalPolicy: RemovalPolicy.DESTROY,
            sortKey: {name: "timestamp", type: AttributeType.STRING},
            tableName: "course-review",
            writeCapacity: 5
        });

        const postFunction: Function = new CourseReviewsFunctions(this, 'handler-post', awsEnv)
            .getFunctionByMethod('POST');

        const courseReviews: Resource = new Resource(this, 'course-reviews', {
            parent: scope.getApiEndpoint(),
            pathPart: "course-reviews"
        });

        const options: Method = courseReviews.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: ['POST', 'OPTIONS'],
        });
        const post: Method = courseReviews.addMethod('POST', new LambdaIntegration(postFunction, {proxy: true}), {
            operationName: "BatchGetReviews"
        });

    }
}