import * as cdk from "@aws-cdk/core";
import {
    AwsIntegration,
    DomainName,
    EndpointType,
    LambdaIntegration,
    LambdaRestApi,
    MockIntegration,
    RestApi,
    SpecRestApi,
    Stage
} from "@aws-cdk/aws-apigateway";
import {HttpApi, HttpMethod} from "@aws-cdk/aws-apigatewayv2";
import {GraphqlApi} from "@aws-cdk/aws-appsync";

import {AbstractRestApiService, CourseReviewsApiService, FeedsApiService, SyllabusApiService} from "./api-service";
import {
    articleListSchema,
    articlePlainJson,
    baseJsonApiSchema,
    courseReviewReqSchema,
    courseReviewRespSchema,
    syllabusSchema
} from "../configs/api/schema";
import {CourseReviewsFunctions} from "./lambda-functions";
import {ManagedPolicy, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {AwsServicePrincipal} from "../configs/aws";
import {ApiServices} from "../configs/api/service";


export interface ApiEndpointProps {

    dataSource: string;
}

export abstract class AbstractApiEndpoint extends cdk.Construct {

    abstract readonly apiEndpoint: RestApi | LambdaRestApi | SpecRestApi | HttpApi | GraphqlApi;

    protected constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id);
    }
}

export abstract class AbstractRestApiEndpoint extends AbstractApiEndpoint {

    abstract readonly apiEndpoint: RestApi;

    abstract readonly apiServices: { [name in ApiServices]?: AbstractRestApiService };

    abstract readonly stages: { [name: string]: Stage };

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
}

export class WasedaTimeRestApiEndpoint extends AbstractRestApiEndpoint {

    readonly apiEndpoint: RestApi;

    readonly apiServices: { [name in ApiServices]?: AbstractRestApiService } = {};

    readonly stages: { [name: string]: Stage } = {};

    constructor(scope: cdk.Construct, id: string, props: ApiEndpointProps) {
        super(scope, id, props);

        this.apiEndpoint = new RestApi(this, 'rest-api', {
            restApiName: "wasedatime-rest-api",
            endpointTypes: [EndpointType.REGIONAL],
            cloudWatchRole: false,
            deploy: true,
            deployOptions: {
                throttlingBurstLimit: 10,
                throttlingRateLimit: 10,
                stageName: 'prod',
                description: "Production stage"
            }
        });
        this.stages['prod'] = this.apiEndpoint.deploymentStage;


        // const apiDomainCert = new Certificate(this, 'domain-certificate', {
        //     domainName: "api." + WEBAPP_DOMAIN,
        //     validation: CertificateValidation.fromEmail()
        // });
        // const domain = this.apiEndpoint.addDomainName('domain', {
        //     certificate: Certificate.fromCertificateArn(this, 'api-domain',
        //         'arn:aws:acm:ap-northeast-1:564383102056:certificate/f5ae3aa1-b20c-40e5-8dfe-4baabb1540fd'),
        //     domainName: "api." + WEBAPP_DOMAIN,
        //     endpointType: EndpointType.REGIONAL,
        //     securityPolicy: SecurityPolicy.TLS_1_2
        // });
        // domain.addBasePathMapping(this.apiEndpoint, {
        //     basePath: 'v1',
        //     stage: this.stages['prod']
        // });
        // domain.addBasePathMapping(this.apiEndpoint, {
        //     basePath: 'staging',
        //     stage: this.stages['dev']
        // });

        const syllabusSchoolModel = this.apiEndpoint.addModel('syllabus-model', {
            schema: syllabusSchema,
            contentType: "application/json",
            description: "The new syllabus JSON schema for each school.",
            modelName: "Syllabus"
        });
        const courseReviewsReqModel = this.apiEndpoint.addModel('course-reviews-req-model', {
            schema: courseReviewReqSchema,
            contentType: "application/json",
            description: "HTTP POST request body schema for fetching reviews for several courses",
            modelName: "ReviewsReq"
        });
        const courseReviewsRespModel = this.apiEndpoint.addModel('course-reviews-resp-model', {
            schema: courseReviewRespSchema,
            contentType: "application/json",
            description: "HTTP POST response body schema for fetching reviews for several courses",
            modelName: "ReviewsResp"
        });
        const baseJsonApiModel = this.apiEndpoint.addModel('base-json-api-model', {
            schema: baseJsonApiSchema,
            contentType: "application/json",
            description: "Base model for JSON-API specification.",
            modelName: "BaseJsonAPI"
        });
        const articleListModel = this.apiEndpoint.addModel('article-list-model', {
            schema: articleListSchema,
            contentType: "application/json",
            description: "List of articles in feeds",
            modelName: "ArticleList"
        });

        const syllabusIntegration = new AwsIntegration(
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
                        roleName: "api-s3-read",
                        managedPolicies: [ManagedPolicy.fromManagedPolicyArn(this, 's3-read-only',
                            "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess")],
                    }),
                    requestParameters: {['integration.request.path.school']: 'method.request.path.school'}
                }
            }
        );
        const courseReviewsFunctions = new CourseReviewsFunctions(this, 'handler-post');
        const courseReviewsPostIntegration = new LambdaIntegration(
            courseReviewsFunctions.postFunction, {proxy: true}
        );
        const courseReviewsPutIntegration = new LambdaIntegration(
            courseReviewsFunctions.putFunction, {proxy: true}
        );
        const feedsIntegration = new MockIntegration({
            integrationResponses: [{
                statusCode: '200',
                responseTemplates: {["application/json"]: articlePlainJson}
            }]
        });

        this.apiServices[ApiServices.SYLLABUS] = new SyllabusApiService(this, 'syllabus-api', {
            integrations: {[HttpMethod.GET]: syllabusIntegration},
            models: {
                [HttpMethod.GET]: {
                    resp: syllabusSchoolModel
                }
            }
        });
        this.apiServices[ApiServices.COURSE_REVIEW] = new CourseReviewsApiService(this, 'course-reviews-api', {
            integrations: {
                [HttpMethod.POST]: courseReviewsPostIntegration,
                [HttpMethod.PUT]: courseReviewsPutIntegration
            },
            models: {
                [HttpMethod.POST]: {
                    req: courseReviewsReqModel,
                    resp: courseReviewsRespModel
                },
                [HttpMethod.PUT]: {
                    //todo req model
                    resp: baseJsonApiModel
                }
            }
        });
        this.apiServices[ApiServices.FEEDS] = new FeedsApiService(this, 'feeds-api', {
            integrations: {[HttpMethod.GET]: feedsIntegration},
            models: {
                [HttpMethod.GET]: {
                    resp: articleListModel
                }
            }
        });
    }
}