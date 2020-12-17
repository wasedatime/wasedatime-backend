import * as cdk from "@aws-cdk/core";
import {Integration, LambdaIntegration, Method, Resource} from "@aws-cdk/aws-apigateway";
import {Function} from "@aws-cdk/aws-lambda";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";

import {CourseReviewsFunctions} from "./lambda-functions";
import {AbstractRestApiEndpoint} from "./api-endpoint";
import {allowHeaders, allowOrigins} from "../configs/api/cors";


export interface ApiServiceProps {

    integrations: { [method in HttpMethod]?: Integration };
}

export abstract class AbstractRestApiService extends cdk.Construct {

    readonly integrations: { [method in HttpMethod]?: Integration };

    abstract resource: Resource;

    abstract methods: { [method in HttpMethod]?: Method };

    protected constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {

        super(scope, id);

        this.integrations = props.integrations;
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
        });
    }
}

//todo add model validation and method response options
export class CourseReviewApi extends AbstractRestApiService {

    readonly resource: Resource;

    readonly methods: { [method in HttpMethod]?: Method };

    constructor(scope: AbstractRestApiEndpoint, id: string, props: ApiServiceProps) {
        super(scope, id, props);

        const postFunction: Function = new CourseReviewsFunctions(this, 'handler-post').postFunction;

        this.resource = new Resource(this, 'course-reviews', {
            parent: scope.apiEndpoint.root,
            pathPart: "course-reviews"
        });

        this.methods[HttpMethod.OPTIONS] = this.resource.addCorsPreflight({
            allowOrigins: allowOrigins,
            allowHeaders: allowHeaders,
            allowMethods: [HttpMethod.POST, HttpMethod.OPTIONS],
        });
        this.integrations[HttpMethod.POST] = new LambdaIntegration(postFunction, {proxy: true})
        this.methods[HttpMethod.POST] = this.resource.addMethod(HttpMethod.POST, this.integrations[HttpMethod.POST],
            {operationName: "BatchGetReviews"}
        );
    }
}