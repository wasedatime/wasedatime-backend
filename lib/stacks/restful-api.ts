import * as cdk from "@aws-cdk/core";
import {EndpointType, Integration, IntegrationType, Resource, RestApi} from '@aws-cdk/aws-apigateway';
import {allowHeaders, allowOrigins} from "../configs/api";
import {Bucket} from "@aws-cdk/aws-s3";
import {SyllabusDataPipeline} from "./data-pipelines";
import {awsEnv} from "../configs/code-automation";

export class ApiEndpoint extends cdk.Stack {
    private apiEndpoint: RestApi;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-api-dev",
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: false
        });
        new SyllabusApi(this, 'syllabus', awsEnv);
    }

    getApiEndpoint() {
        return this.apiEndpoint.root;
    }
}

export class SyllabusApi extends cdk.Stack {
    constructor(scope: ApiEndpoint, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const syllabusBucket: Bucket = new SyllabusDataPipeline(scope, 'syllabus-datapipeline', awsEnv).getData();
        const syllabus: Resource = new Resource(scope, 'syllabus-api', {
            parent: scope.getApiEndpoint(),
            pathPart: "syllabus"
        });
        const syllabusSchools: Resource = new Resource(scope, 'syllabus-school', {
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
            uri: `https://${syllabusBucket.bucketRegionalDomainName}/syllabus/{item}.json`
        }), {
            apiKeyRequired: false,
        });
    }
}