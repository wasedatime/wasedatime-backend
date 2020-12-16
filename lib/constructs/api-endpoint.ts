import * as cdk from "@aws-cdk/core";
import {EndpointType, LambdaRestApi, Resource, RestApi, SecurityPolicy, SpecRestApi} from "@aws-cdk/aws-apigateway";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {HttpApi} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";

import {AbstractRestApiService, CourseReviewApi} from "./api-service";
import {WEBAPP_DOMAIN} from "../configs/website";
import {courseReviewReqSchema, syllabusSchema} from "../configs/api";


export interface ApiEndpointProps {

}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    abstract apiEndpoint: RestApi;

    abstract apiServices: { [path: string]: AbstractRestApiService }

    abstract getResourcebyPath(path: string): Resource;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }
}

export class WasedaTimeRestApiEndpoint extends AbstractRestApiEndpoint {

    readonly apiEndpoint: RestApi;

    readonly apiServices: { [path: string]: AbstractRestApiService };

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
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

        new CourseReviewApi(this, 'course-review-api');

        // todo add stage & deployment strategy
    }

    getResourcebyPath(path: string): Resource {
        return this.apiServices[""].resource;
    }
}