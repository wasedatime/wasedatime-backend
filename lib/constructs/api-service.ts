import * as cdk from "@aws-cdk/core";
import {Integration, IntegrationType, LambdaIntegration, Method, Resource} from "@aws-cdk/aws-apigateway";
import {Bucket} from "@aws-cdk/aws-s3";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import {Function} from "@aws-cdk/aws-lambda";

import {CourseReviewsFunctions} from "./lambda-functions";
import {allowHeaders, allowOrigins} from "../configs/api";
import {AbstractRestApiEndpoint} from "./api-endpoint";


export interface ApiServiceProps {

    storage: Bucket;
}

export abstract class AbstractRestApiService extends cdk.Construct {

    abstract integrations: { [httpMethod: string]: Integration };

    abstract resource: Resource;

    abstract methods: { [httpMethod: string]: Method };

    protected constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id);
    }
}

export class SyllabusApiService extends AbstractRestApiService {

    readonly integrations: { [httpMethod: string]: Integration };

    readonly resource: Resource;

    readonly methods: { [httpMethod: string]: Method };

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const syllabusBucket: Bucket = props.storage;

        this.resource = new Resource(scope, 'syllabus', {
            parent: scope.apiEndpoint.root,
            pathPart: "syllabus"
        });
        const syllabusSchools: Resource = this.resource.addResource("{school}");

        this.methods['OPTIONS'] = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: ['GET', 'OPTIONS'],
        });
        this.methods['GET'] = syllabusSchools.addMethod('GET', new Integration({
            type: IntegrationType.HTTP,
            integrationHttpMethod: 'GET',
            uri: `https://${syllabusBucket.bucketRegionalDomainName}/syllabus/{school}.json`
        }), {
            apiKeyRequired: false,
        });
    }
}

//todo add model validation and method response options
export class CourseReviewApi extends AbstractRestApiService {

    readonly integrations: { [httpMethod: string]: Integration };

    readonly resource: Resource;

    readonly methods: { [httpMethod: string]: Method };

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const courseReviewTable = new Table(this, 'dynamodb-review-table', {
            partitionKey: {name: "course_key", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            readCapacity: 5,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "timestamp", type: AttributeType.STRING},
            tableName: "course-review",
            writeCapacity: 5
        });

        const postFunction: Function = new CourseReviewsFunctions(this, 'handler-post')
            .getFunctionByMethod('POST');

        this.resource = new Resource(this, 'course-reviews', {
            parent: scope.apiEndpoint.root,
            pathPart: "course-reviews"
        });

        this.methods['OPTIONS'] = this.resource.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: ['POST', 'OPTIONS'],
        });
        this.integrations['POST'] = new LambdaIntegration(postFunction, {proxy: true})
        this.methods['POST'] = this.resource.addMethod('POST', this.integrations['POST'],
            {operationName: "BatchGetReviews"}
        );
    }
}