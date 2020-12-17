import * as cdk from "@aws-cdk/core";
import {
    DomainName,
    EndpointType,
    Integration,
    IntegrationType,
    LambdaRestApi,
    Resource,
    RestApi,
    SecurityPolicy,
    SpecRestApi
} from "@aws-cdk/aws-apigateway";
import {Certificate, CertificateValidation} from "@aws-cdk/aws-certificatemanager";
import {HttpApi, HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";

import {AbstractRestApiService, SyllabusApiService} from "./api-service";
import {WEBAPP_DOMAIN} from "../configs/amplify/website";
import {courseReviewReqSchema, syllabusSchema} from "../configs/api/schema";


export interface ApiEndpointProps {

    dataSource: string;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    abstract apiEndpoint: RestApi;

    abstract apiServices: { [path: string]: AbstractRestApiService };

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);
    }

    getDomain(): string {
        const domainName: DomainName | undefined = this.apiEndpoint.domainName;

        if (typeof domainName === "undefined") {
            throw RangeError("Domain not configured for this API endpoint.");
        }
        return domainName.domainName;
    }

    getResourcebyPath(path: string): Resource {
        return this.apiServices[""].resource;
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

        const syllabusIntegration = new Integration({
            type: IntegrationType.HTTP,
            integrationHttpMethod: 'GET',
            uri: `https://${props.dataSource}/syllabus/{school}.json`
        });

        new SyllabusApiService(this, 'course-review-api', {
            integrations: {[HttpMethod.GET]: syllabusIntegration}
        });

        // todo add stage & deployment strategy
    }
}