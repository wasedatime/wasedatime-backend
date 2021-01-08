import * as cdk from "@aws-cdk/core";
import {
    AuthorizationType,
    AwsIntegration,
    CfnAuthorizer,
    LambdaIntegration,
    Method,
    MockIntegration,
    Model,
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
    courseReviewPatchReqSchema,
    courseReviewPostReqSchema,
    syllabusSchema
} from "../../configs/api/schema";
import {AwsServicePrincipal} from "../../configs/common/aws";
import {CourseReviewsFunctions, SyllabusFunctions, TimetableFunctions} from "../common/lambda-functions";
import {lambdaRespParams, s3RespMapping, syllabusRespParams} from "../../configs/api/mapping";


export interface ApiServiceProps {

    apiEndpoint: RestApi

    dataSource?: string

    authorizer?: CfnAuthorizer
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

        const apiGatewayRole = new Role(this, 'rest-api-s3', {
            assumedBy: new ServicePrincipal(AwsServicePrincipal.API_GATEWAY),
            description: "Allow API Gateway to fetch objects from s3 buckets.",
            path: `/service-role/${AwsServicePrincipal.API_GATEWAY}/`,
            roleName: "s3-apigateway-read",
            managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, 's3-read-only',
                "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess")],
        });

        const getIntegration = new AwsIntegration(
            {
                service: 's3',
                integrationHttpMethod: HttpMethod.GET,
                path: "syllabus/{school}.json",
                subdomain: props.dataSource,
                options: {
                    credentialsRole: apiGatewayRole,
                    requestParameters: {['integration.request.path.school']: 'method.request.path.school'},
                    integrationResponses: [{
                        statusCode: '200',
                        responseParameters: s3RespMapping
                    }]
                }
            }
        );

        const headIntegration = new AwsIntegration(
            {
                service: 's3',
                integrationHttpMethod: HttpMethod.HEAD,
                path: "syllabus/{school}.json",
                subdomain: props.dataSource,
                options: {
                    credentialsRole: apiGatewayRole,
                    requestParameters: {['integration.request.path.school']: 'method.request.path.school'},
                    integrationResponses: [{
                        statusCode: '200',
                        responseParameters: s3RespMapping
                    }]
                }
            }
        );
        const syllabusFunctions = new SyllabusFunctions(this, 'syllabus-function', {
            envVars: {
                'TABLE_NAME': "waseda-syllabus"
            }
        });
        const courseGetIntegration = new LambdaIntegration(
            syllabusFunctions.getFunction, {proxy: true}
        );

        this.methods.OPTIONS = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS, HttpMethod.HEAD]
        });
        this.methods.GET = syllabusSchools.addMethod(HttpMethod.GET, getIntegration, {
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusBySchool",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel},
                responseParameters: syllabusRespParams
            }]
        });
        this.methods.HEAD = syllabusSchools.addMethod(HttpMethod.HEAD, headIntegration, {
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusMetadataBySchool",
            methodResponses: [{
                statusCode: '200',
                responseParameters: syllabusRespParams
            }]
        });

        root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        });
        root.addMethod(HttpMethod.GET, courseGetIntegration, {
            operationName: "GetCourses",
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true,
                'method.request.querystring.id': false
            },
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
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
        }).addResource('{key}');
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
        const patchReqModel = props.apiEndpoint.addModel('review-patch-req-model', {
            schema: courseReviewPatchReqSchema,
            contentType: "application/json",
            description: "HTTP PATCH request body schema for updating a review",
            modelName: "PatchReviewReq"
        });

        const courseReviewsFunctions = new CourseReviewsFunctions(this, 'crud-functions', {
            envVars: {
                'TABLE_NAME': props.dataSource!
            }
        });
        const getIntegration = new LambdaIntegration(
            courseReviewsFunctions.getFunction, {proxy: true}
        );
        const postIntegration = new LambdaIntegration(
            courseReviewsFunctions.postFunction, {proxy: true}
        );
        const patchIntegration = new LambdaIntegration(
            courseReviewsFunctions.patchFunction, {proxy: true}
        );
        const deleteIntegration = new LambdaIntegration(
            courseReviewsFunctions.deleteFunction, {proxy: true}
        );

        const userPoolAuth = props.authorizer!;

        this.methods.OPTIONS = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.OPTIONS]
        });
        this.methods.GET = root.addMethod(HttpMethod.GET, getIntegration,
            {
                requestParameters: {
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
        this.methods.PATCH = root.addMethod(HttpMethod.PATCH, patchIntegration,
            {
                operationName: "UpdateReview",
                requestParameters: {
                    'method.request.querystring.ts': true
                },
                requestModels: {["application/json"]: patchReqModel},
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: {authorizerId: userPoolAuth.ref},
                authorizationType: AuthorizationType.COGNITO
            }
        );
        this.methods.DELETE = root.addMethod(HttpMethod.DELETE, deleteIntegration,
            {
                operationName: "DeleteReview",
                requestParameters: {
                    'method.request.querystring.ts': true
                },
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: {authorizerId: userPoolAuth.ref},
                authorizationType: AuthorizationType.COGNITO
            }
        );
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
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true
            },
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel},
                responseParameters: lambdaRespParams
            }]
        });
        this.methods[HttpMethod.POST] = root.addMethod(HttpMethod.POST, postIntegration, {
            operationName: "PostArticles",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }]
        });
    }
}

export class CareerApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'career', {
            parent: scope.apiEndpoint.root,
            pathPart: "career"
        });
        const intern = root.addResource('intern');
        const part = root.addResource('part-time');
        const seminar = root.addResource('seminar');

        const internGetIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: "{}"}
            }]
        });
        const partGetIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: "{}"}
            }]
        });
        const seminarGetIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: "{}"}
            }]
        });

        [intern, part, seminar].forEach((value => value.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        })));
        intern.addMethod(HttpMethod.GET, internGetIntegration, {
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true,
                'method.request.querystring.ind': false,
                'method.request.querystring.dl': false,
                'method.request.querystring.lang': false
            },
            operationName: "GetInternInfo",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: Model.EMPTY_MODEL},
                responseParameters: lambdaRespParams
            }]
        });
        part.addMethod(HttpMethod.GET, partGetIntegration, {
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true,
                'method.request.querystring.loc': false,
                'method.request.querystring.dl': false,
                'method.request.querystring.lang': false,
                'method.request.querystring.pay': false,
                'method.request.querystring.freq': false,
            },
            operationName: "GetParttimeInfo",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: Model.EMPTY_MODEL},
                responseParameters: lambdaRespParams
            }]
        });
        seminar.addMethod(HttpMethod.GET, seminarGetIntegration, {
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true,
                'method.request.querystring.ind': false,
                'method.request.querystring.duration': false,
                'method.request.querystring.lang': false,
                'method.request.querystring.dl': false,
                'method.request.querystring.major': false,
            },
            operationName: "GetSeminarInfo",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: Model.EMPTY_MODEL},
                responseParameters: lambdaRespParams
            }]
        });
    }
}

export class TimetableApiService extends AbstractRestApiService {

    readonly resources: { [path: string]: Resource } = {};

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'timetable', {
            parent: scope.apiEndpoint.root,
            pathPart: "timetable"
        });
        this.resources["/timetable"] = root;
        const timetableImport = root.addResource('import');
        const timetableExport = root.addResource('export');

        const timetableFunctions = new TimetableFunctions(this, 'crud-functions', {
            envVars: {
                'TABLE_NAME': props.dataSource!
            }
        });
        const getIntegration = new LambdaIntegration(
            timetableFunctions.getFunction, {proxy: true}
        );
        const postIntegration = new LambdaIntegration(
            timetableFunctions.postFunction, {proxy: true}
        );
        const patchIntegration = new LambdaIntegration(
            timetableFunctions.patchFunction, {proxy: true}
        );
        const importIntegration = new LambdaIntegration(
            timetableFunctions.importFunction, {proxy: true}
        );
        const exportIntegration = new LambdaIntegration(
            timetableFunctions.exportFunction, {proxy: true}
        );

        const userPoolAuth = props.authorizer!;

        this.methods[HttpMethod.OPTIONS] = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.OPTIONS, HttpMethod.DELETE]
        });
        this.methods[HttpMethod.GET] = root.addMethod(HttpMethod.GET, getIntegration, {
            operationName: "GetTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: {authorizerId: userPoolAuth.ref},
            authorizationType: AuthorizationType.COGNITO
        });
        this.methods[HttpMethod.POST] = root.addMethod(HttpMethod.POST, postIntegration, {
            operationName: "PostTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: {authorizerId: userPoolAuth.ref},
            authorizationType: AuthorizationType.COGNITO
        });
        this.methods[HttpMethod.PATCH] = root.addMethod(HttpMethod.PATCH, patchIntegration, {
            operationName: "UpdateTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: {authorizerId: userPoolAuth.ref},
            authorizationType: AuthorizationType.COGNITO
        });
        timetableImport.addMethod(HttpMethod.POST, importIntegration, {
            operationName: "ImportTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }]
        });
        timetableExport.addMethod(HttpMethod.POST, exportIntegration, {
            operationName: "ExportTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }]
        });
    }
}