import * as cdk from "@aws-cdk/core";
import {IModel, Integration, Method, Resource} from "@aws-cdk/aws-apigateway";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {AbstractRestApiEndpoint} from "./api-endpoint";
import {allowHeaders, allowOrigins} from "../configs/api/cors";


export interface ApiServiceProps {

    integrations: { [method in HttpMethod]?: Integration };

    models: { [method in HttpMethod]?: IModel };
}

export abstract class AbstractRestApiService extends cdk.Construct {

    abstract resource: Resource;

    abstract methods: { [method in HttpMethod]?: Method };

    protected constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {

        super(scope, id);
    }
}

export class SyllabusApiService extends AbstractRestApiService {

    readonly resource: Resource;

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        this.resource = new Resource(scope, 'syllabus', {
            parent: scope.apiEndpoint.root,
            pathPart: "syllabus"
        });
        const syllabusSchools: Resource = this.resource.addResource("{school}");

        this.methods[HttpMethod.OPTIONS] = syllabusSchools.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
        });
        this.methods[HttpMethod.GET] = syllabusSchools.addMethod(HttpMethod.GET, props.integrations[HttpMethod.GET], {
            apiKeyRequired: false,
            operationName: "GetSyllabusBySchool",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: props.models[HttpMethod.GET]!}
            }]
        });
    }
}

export class CourseReviewsApiService extends AbstractRestApiService {

    readonly resource: Resource;

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        this.resource = new Resource(this, 'course-reviews', {
            parent: scope.apiEndpoint.root,
            pathPart: "course-reviews"
        });

        this.methods[HttpMethod.OPTIONS] = this.resource.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.POST, HttpMethod.OPTIONS],
        });
        this.methods[HttpMethod.POST] = this.resource.addMethod(HttpMethod.POST, props.integrations[HttpMethod.POST],
            {
                operationName: "BatchGetReviews",
                methodResponses: [{
                    statusCode: '200',
                    responseModels: {["application/json"]: props.models[HttpMethod.POST]!}
                }]
            }
        );
    }
}

export class FeedsApiService extends AbstractRestApiService {

    readonly resource: Resource;

    readonly methods: { [method in HttpMethod]?: Method } = {};

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        this.resource = new Resource(scope, 'feeds', {
            parent: scope.apiEndpoint.root,
            pathPart: "feeds"
        });

        this.methods[HttpMethod.OPTIONS] = this.resource.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.GET, HttpMethod.OPTIONS],
        });
        this.methods[HttpMethod.GET] = this.resource.addMethod(HttpMethod.GET, props.integrations[HttpMethod.GET], {
            apiKeyRequired: false,
            operationName: "ListArticles",
            methodResponses: [{
                statusCode: '200',
                responseModels: {["application/json"]: props.models[HttpMethod.GET]!}
            }]
        });
    }
}