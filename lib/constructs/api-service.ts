import * as cdk from "@aws-cdk/core";
import {IModel, Integration, Method, Resource} from "@aws-cdk/aws-apigateway";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {AbstractRestApiEndpoint} from "./api-endpoint";
import {allowHeaders, allowOrigins} from "../configs/api/cors";


export interface ApiServiceProps {

    integrations: { [method in HttpMethod]?: Integration };

    models: { [method in HttpMethod]?: { req?: IModel, resp?: IModel } };
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

        this.methods.OPTIONS = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
        });
        this.methods.GET = syllabusSchools.addMethod(HttpMethod.GET, props.integrations.GET, {
            apiKeyRequired: false,
            requestParameters: {['method.request.path.school']: true},
            operationName: "GetSyllabusBySchool",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: props.models.GET!.resp!}
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

        this.methods.OPTIONS = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.POST, HttpMethod.OPTIONS],
        });
        this.methods.POST = root.addMethod(HttpMethod.POST, props.integrations.POST,
            {
                operationName: "BatchGetReviews",
                requestModels: {["application/json"]: props.models.POST!.req!},
                methodResponses: [{
                    statusCode: '200',
                    responseModels: {["application/json"]: props.models.POST!.resp!}
                }]
            }
        );
        this.methods.PUT = root.addMethod(HttpMethod.PUT, props.integrations.PUT,
            {
                operationName: "UpdateReview",
                methodResponses: [{
                    statusCode: '200',
                    responseModels: {["application/json"]: props.models.PUT!.resp!}
                }]
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

        this.methods[HttpMethod.OPTIONS] = root.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
        });
        this.methods[HttpMethod.GET] = root.addMethod(HttpMethod.GET, props.integrations.GET, {
            apiKeyRequired: false,
            requestParameters: {
                'method.request.querystring.offset': true,
                'method.request.querystring.limit': true
            },
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: props.models.GET!.resp!}
            }]
        });
    }
}