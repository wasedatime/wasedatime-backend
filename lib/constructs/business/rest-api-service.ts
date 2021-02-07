import * as cdk from "@aws-cdk/core";
import {
    AwsIntegration,
    IAuthorizer,
    LambdaIntegration,
    Method,
    MockIntegration,
    Model,
    PassthroughBehavior,
    RequestValidator,
    Resource,
    RestApi
} from "@aws-cdk/aws-apigateway";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";

import {AbstractRestApiEndpoint} from "./api-endpoint";
import {allowHeaders, allowOrigins} from "../../configs/api-gateway/cors";
import {
    articleListSchema,
    articlePlainJson,
    courseReviewGetRespSchema,
    courseReviewPatchReqSchema,
    courseReviewPostReqSchema,
    syllabusSchema
} from "../../configs/api-gateway/schema";
import {AwsServicePrincipal} from "../../configs/common/aws";
import {CourseReviewsFunctions, SyllabusFunctions, TimetableFunctions} from "../common/lambda-functions";
import {lambdaRespParams, mockRespMapping, s3RespMapping, syllabusRespParams} from "../../configs/api-gateway/mapping";


export interface RestApiServiceProps {

    apiEndpoint: RestApi;

    dataSource?: string;

    authorizer?: IAuthorizer;

    validator?: RequestValidator;
}

export abstract class AbstractRestApiService extends cdk.Construct {

    abstract readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    protected constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
        super(scope, id);
    }
}

export class SyllabusApiService extends AbstractRestApiService {

    readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'syllabus', {
            parent: scope.apiEndpoint.root,
            pathPart: "syllabus"
        });
        const syllabusSchools: Resource = root.addResource("{school}");

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
                'TABLE_NAME': "syllabus"
            }
        });
        const courseGetIntegration = new LambdaIntegration(
            syllabusFunctions.getFunction, {proxy: true}
        );

        const optionsSyllabusSchools = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS, HttpMethod.HEAD]
        });
        const getSyllabusSchools = syllabusSchools.addMethod(HttpMethod.GET, getIntegration, {
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusBySchool",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel},
                responseParameters: syllabusRespParams
            }],
            requestValidator: props.validator
        });
        const headSyllabusSchools = syllabusSchools.addMethod(HttpMethod.HEAD, headIntegration, {
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusMetadataBySchool",
            methodResponses: [{
                statusCode: '200',
                responseParameters: syllabusRespParams
            }],
            requestValidator: props.validator
        });

        const optionsSyllabusCourses = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        });
        const getSyllabusCourses = root.addMethod(HttpMethod.GET, courseGetIntegration, {
            operationName: "GetCourses",
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true,
                'method.request.querystring.id': false
            },
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            requestValidator: props.validator
        });

        this.resourceMapping = {
            "/syllabus": {
                [HttpMethod.GET]: getSyllabusCourses,
                [HttpMethod.OPTIONS]: optionsSyllabusCourses
            },
            "/syllabus/{school}": {
                [HttpMethod.GET]: getSyllabusSchools,
                [HttpMethod.OPTIONS]: optionsSyllabusSchools,
                [HttpMethod.HEAD]: headSyllabusSchools
            }
        };
    }
}

export class CourseReviewsApiService extends AbstractRestApiService {

    readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(this, 'course-reviews', {
            parent: scope.apiEndpoint.root,
            pathPart: "course-reviews"
        }).addResource('{key}');

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

        const optionsCourseReviews = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.OPTIONS]
        });
        const getCourseReviews = root.addMethod(HttpMethod.GET, getIntegration,
            {
                requestParameters: {
                    'method.request.querystring.uid': false
                },
                operationName: "GetReviews",
                methodResponses: [{
                    statusCode: '200',
                    responseModels: {["application/json"]: getRespModel},
                    responseParameters: lambdaRespParams
                }],
                requestValidator: props.validator
            }
        );
        const postCourseReviews = root.addMethod(HttpMethod.POST, postIntegration,
            {
                operationName: "PostReview",
                requestModels: {["application/json"]: postReqModel},
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: props.authorizer,
                requestValidator: props.validator
            }
        );
        const patchCourseReviews = root.addMethod(HttpMethod.PATCH, patchIntegration,
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
                authorizer: props.authorizer,
                requestValidator: props.validator
            }
        );
        const deleteCourseReviews = root.addMethod(HttpMethod.DELETE, deleteIntegration,
            {
                operationName: "DeleteReview",
                requestParameters: {
                    'method.request.querystring.ts': true
                },
                methodResponses: [{
                    statusCode: '200',
                    responseParameters: lambdaRespParams
                }],
                authorizer: props.authorizer,
                requestValidator: props.validator
            }
        );

        this.resourceMapping = {
            "/course-reviews/{key}": {
                [HttpMethod.GET]: getCourseReviews,
                [HttpMethod.OPTIONS]: optionsCourseReviews,
                [HttpMethod.PATCH]: patchCourseReviews,
                [HttpMethod.POST]: postCourseReviews,
                [HttpMethod.DELETE]: deleteCourseReviews
            }
        };
    }
}

export class FeedsApiService extends AbstractRestApiService {

    readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'feeds', {
            parent: scope.apiEndpoint.root,
            pathPart: "feeds"
        });

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
                responseTemplates: {["application/json"]: articlePlainJson},
                responseParameters: mockRespMapping
            }]
        });
        const postIntegration = new MockIntegration({
            requestTemplates: {["application/json"]: '{"statusCode": 200}'},
            passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
            integrationResponses: [{
                statusCode: '200'
            }]
        });

        const optionsFeeds = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS]
        });
        const getFeeds = root.addMethod(HttpMethod.GET, getIntegration, {
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true
            },
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: getRespModel},
                responseParameters: lambdaRespParams
            }],
            requestValidator: props.validator
        });
        const postFeeds = root.addMethod(HttpMethod.POST, postIntegration, {
            operationName: "PostArticles",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            requestValidator: props.validator
        });

        this.resourceMapping = {
            "/feeds": {
                [HttpMethod.OPTIONS]: optionsFeeds,
                [HttpMethod.GET]: getFeeds,
                [HttpMethod.POST]: postFeeds
            }
        };
    }
}

export class CareerApiService extends AbstractRestApiService {

    readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
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
            }],
            requestValidator: props.validator
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
            }],
            requestValidator: props.validator
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
            }],
            requestValidator: props.validator
        });
    }
}

export class TimetableApiService extends AbstractRestApiService {

    readonly resourceMapping: { [path: string]: { [method in HttpMethod]?: Method } } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
        super(scope, id, props);

        const root = new Resource(scope, 'timetable', {
            parent: scope.apiEndpoint.root,
            pathPart: "timetable"
        });
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

        const optionsTimetable = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.POST, HttpMethod.PATCH, HttpMethod.OPTIONS, HttpMethod.DELETE]
        });
        const getTimetable = root.addMethod(HttpMethod.GET, getIntegration, {
            operationName: "GetTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: props.authorizer,
            requestValidator: props.validator
        });
        const postTimetable = root.addMethod(HttpMethod.POST, postIntegration, {
            operationName: "PostTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: props.authorizer,
            requestValidator: props.validator
        });
        const patchTimetable = root.addMethod(HttpMethod.PATCH, patchIntegration, {
            operationName: "UpdateTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            authorizer: props.authorizer,
            requestValidator: props.validator
        });

        [timetableImport, timetableExport].forEach(value => value.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.POST, HttpMethod.OPTIONS]
        }));
        const importTimetable = timetableImport.addMethod(HttpMethod.POST, importIntegration, {
            operationName: "ImportTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            requestValidator: props.validator
        });
        const exportTimetable = timetableExport.addMethod(HttpMethod.POST, exportIntegration, {
            operationName: "ExportTimetable",
            methodResponses: [{
                statusCode: '200',
                responseParameters: lambdaRespParams
            }],
            requestValidator: props.validator
        });

        this.resourceMapping = {
            "/timetable": {
                [HttpMethod.OPTIONS]: optionsTimetable,
                [HttpMethod.GET]: getTimetable,
                [HttpMethod.PATCH]: patchTimetable,
                [HttpMethod.POST]: postTimetable
            },
            "/timetable/export": {
                [HttpMethod.POST]: exportTimetable
            },
            "/timetable/import": {
                [HttpMethod.POST]: importTimetable
            }
        };
    }
}