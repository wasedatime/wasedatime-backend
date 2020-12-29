import * as cdk from "@aws-cdk/core";
import {
    AuthorizationType,
    AwsIntegration,
    CfnAuthorizer,
    LambdaIntegration,
    Method,
    MockIntegration,
    PassthroughBehavior,
    Resource,
    RestApi
} from "@aws-cdk/aws-apigateway";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AbstractRestApiEndpoint} from "./api-endpoint";
import {allowHeaders, allowOrigins} from "../../configs/api/cors";
import {
    articleListSchema,
    articlePlainJson,
    courseReviewGetRespSchema,
    courseReviewPostReqSchema,
    syllabusSchema
} from "../../configs/api/schema";
import {AwsServicePrincipal} from "../../configs/common/aws";
import {CourseReviewsFunctions} from "../common/lambda-functions";
import {lambdaRespParams, s3RespMapping, syllabusRespParams} from "../../configs/api/mapping";


export interface ApiServiceProps {

    apiEndpoint: RestApi

    dataSource?: string

    authorizer?: string
}

export abstract class AbstractRestApiService extends cdk.Construct {

    abstract readonly resources: { [path: string]: Resource };

    abstract readonly methods: { [method in HttpMethod]?: Method };

    protected constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {

        super(scope, id);
    }
}

export class SyllabusApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'syllabus', {
            parent: scope.apiEndpoint.root,
            pathPart: "syllabus"
        });
        this.resources["/syllabus"] = root;
        const syllabusSchools: Resource = root.addResource("{school}");
        this.resources["/{school}"] = syllabusSchools;

        const getRespModel = props.apiEndpoint.addModel('syllabus-get-resp-model', {
            schema: syllabusSchema,
            contentType: "application/json",
            description: "The new syllabus JSON schema for each school.",
            modelName: "GetSyllabusResp"
        });

        const getIntegration = new AwsIntegration(
            {
                service: 's3',
                integrationHttpMethod: HttpMethod.GET,
                path: "syllabus/{school}.json",
                subdomain: props.dataSource,
                options: {
                    credentialsRole: new Role(this, 'rest-api-s3', {
                        assumedBy: new ServicePrincipal(AwsServicePrincipal.API_GATEWAY),
                        description: "Allow API Gateway to fetch objects from s3 buckets.",
                        path: `/service-role/${AwsServicePrincipal.API_GATEWAY}/`,
                        roleName: "s3-apigateway-read",
                        managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, 's3-read-only',
                            "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess")],
                    }),
                    requestParameters: {['integration.request.path.school']: 'method.request.path.school'},
                    integrationResponses: [{
                        statusCode: '200',
                        responseParameters: s3RespMapping
                    }]
                }
            }
        );

        this.methods.OPTIONS = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        });
        this.methods.GET = syllabusSchools.addMethod(HttpMethod.GET, getIntegration, {
            apiKeyRequired: false,
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusBySchool",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel},
                responseParameters: syllabusRespParams
            }]
        });
    }
}

export class CourseReviewsApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(this, 'course-reviews', {
            parent: scope.apiEndpoint.root,
            pathPart: "course-reviews"
        });
        this.resources["/course-reviews"] = root;

        const getRespModel = props.apiEndpoint.addModel('review-get-resp-model', {
            schema: courseReviewGetRespSchema,
            contentType: "application/json",
            description: "HTTP GET response body schema for fetching reviews.",
            modelName: "GetReviewsResp"
        });
        const postReqModel = props.apiEndpoint.addModel('review-post-req-model', {
            schema: courseReviewPostReqSchema,
            contentType: "application/json",
            description: "HTTP POST request body schema for submitting the review.",
            modelName: "PostReviewReq"
        });
        const putReqModel = props.apiEndpoint.addModel('review-put-req-model', {
            schema: courseReviewPostReqSchema,
            contentType: "application/json",
            description: "HTTP PUT request body schema for updating a review",
            modelName: "PutReviewReq"
        });

        const courseReviewsFunctions = new CourseReviewsFunctions(this, 'crud-functions', {
            envvars: {
                'TABLE_NAME': props.dataSource!
            }
        });
        const getIntegration = new LambdaIntegration(
            courseReviewsFunctions.getFunction, {proxy: true}
        );
        const postIntegration = new LambdaIntegration(
            courseReviewsFunctions.postFunction, {proxy: true}
        );
        const putIntegration = new LambdaIntegration(
            courseReviewsFunctions.putFunction, {proxy: true}
        );

        const userPoolAuth = new CfnAuthorizer(this, 'cognito-authorizer', {
            name: 'user-pool-authorizer',
            identitySource: 'method.request.header.Authorization',
            providerArns: [props.authorizer!],
            restApiId: props.apiEndpoint.restApiId,
            type: AuthorizationType.COGNITO
        });

        this.methods.OPTIONS = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.POST, HttpMethod.OPTIONS]
        });
        this.methods.GET = root.addMethod(HttpMethod.GET, getIntegration,
            {
                requestParameters: {
                    'method.request.querystring.key': true,
                    'method.request.querystring.uid': true
                },
                operationName: "GetReviews",
                methodResponses: [{
                    statusCode: '200',
                    responseModels: {["application/json"]: getRespModel},
                    responseParameters: lambdaRespParams
                }]
            }
        );
        this.methods.POST = root.addMethod(HttpMethod.POST, postIntegration,
            {
                requestParameters: {
                    'method.request.header.Authorization': true
                },
                operationName: "PostReview",
                requestModels: {["application/json"]: postReqModel},
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: {authorizerId: userPoolAuth.ref},
                authorizationType: AuthorizationType.COGNITO
            }
        );
        this.methods.PUT = root.addMethod(HttpMethod.PUT, putIntegration,
            {
                requestParameters: {
                    'method.request.header.Authorization': true
                },
                operationName: "UpdateReview",
                requestModels: {["application/json"]: putReqModel},
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: {authorizerId: userPoolAuth.ref},
                authorizationType: AuthorizationType.COGNITO
            });
    }
}

export class FeedsApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'feeds', {
            parent: scope.apiEndpoint.root,
            pathPart: "feeds"
        });
        this.resources["/feeds"] = root;

        const getRespModel = props.apiEndpoint.addModel('feeds-get-resp-model', {
            schema: articleListSchema,
            contentType: "application/json",
            description: "List of articles in feeds",
            modelName: "GetFeedsResp"
        });

        const getIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: articlePlainJson}
            }]
        });
        const postIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200'
            }]
        });

        this.methods[HttpMethod.OPTIONS] = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        });
        this.methods[HttpMethod.GET] = root.addMethod(HttpMethod.GET, getIntegration, {
            apiKeyRequired: false,
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true
            },
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel}
            }]
        });
        this.methods[HttpMethod.POST] = root.addMethod(HttpMethod.POST, postIntegration, {
            apiKeyRequired: false,
            operationName: "PostArticles",
            methodResponses: [{
                statusCode: '200'
            }]
        });
    }
}

//todo career api
export class CareerApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'career', {
            parent: scope.apiEndpoint.root,
            pathPart: "career"
        });
        this.resources["/career"] = root;
        this.resources["/career/intern"] = root.addResource("intern");
        this.resources["/career/part-time"] = root.addResource("part-time");
        this.resources["/career/seminar"] = root.addResource("seminar");

        const getRespModel = props.apiEndpoint.addModel('careeer-get-resp-model', {
            schema: articleListSchema,
            contentType: "application/json",
            description: "List of articles in feeds",
            modelName: "GetFeedsResp"
        });

        const getIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: articlePlainJson}
            }]
        });

        this.methods[HttpMethod.OPTIONS] = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
        });
        this.methods[HttpMethod.GET] = root.addMethod(HttpMethod.GET, getIntegration, {
            apiKeyRequired: false,
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true
            },
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel}
            }]
        });
    }
}