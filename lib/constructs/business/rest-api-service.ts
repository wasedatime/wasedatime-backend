import * as apigw2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { allowHeaders, allowOrigins } from '../../configs/api-gateway/cors';
import { lambdaRespParams, s3RespMapping, syllabusRespParams } from '../../configs/api-gateway/mapping';
import {
  courseReviewGetRespSchema,
  courseReviewPatchReqSchema,
  courseReviewPostReqSchema,
  syllabusSchema,
} from '../../configs/api-gateway/schema';
import { AwsServicePrincipal } from '../../configs/common/aws';
import { CourseReviewsFunctions, SyllabusFunctions, TimetableFunctions } from '../common/lambda-functions';
import { AbstractRestApiEndpoint } from './api-endpoint';

export interface RestApiServiceProps {
  dataSource?: string;
  authorizer?: apigw.IAuthorizer;
  validator?: apigw.RequestValidator;
}

export class RestApiService extends Construct {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id);
  }
}

export class SyllabusApiService extends RestApiService {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('syllabus');
    const syllabusSchools = root.addResource('{school}');
    const bookInfo = root.addResource('book-info');

    const getRespModel = scope.apiEndpoint.addModel('syllabus-get-resp-model', {
      schema: syllabusSchema,
      contentType: 'application/json',
      description: 'The new syllabus JSON schema for each school.',
      modelName: 'GetSyllabusResp',
    });

    const apiGatewayRole = new iam.Role(this, 'rest-api-s3', {
      assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.API_GATEWAY),
      description: 'Allow API Gateway to fetch objects from s3 buckets.',
      path: `/service-role/${ AwsServicePrincipal.API_GATEWAY }/`,
      roleName: 's3-apigateway-read',
      managedPolicies: [iam.ManagedPolicy.fromManagedPolicyArn(this, 's3-read-only',
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess')],
    });

    const getIntegration = new apigw.AwsIntegration(
      {
        service: 's3',
        integrationHttpMethod: apigw2.HttpMethod.GET,
        path: 'syllabus/{school}.json',
        subdomain: props.dataSource,
        options: {
          credentialsRole: apiGatewayRole,
          requestParameters: { ['integration.request.path.school']: 'method.request.path.school' },
          integrationResponses: [{
            statusCode: '200',
            responseParameters: s3RespMapping,
          }],
        },
      },
    );

    const headIntegration = new apigw.AwsIntegration(
      {
        service: 's3',
        integrationHttpMethod: apigw2.HttpMethod.HEAD,
        path: 'syllabus/{school}.json',
        subdomain: props.dataSource,
        options: {
          credentialsRole: apiGatewayRole,
          requestParameters: { ['integration.request.path.school']: 'method.request.path.school' },
          integrationResponses: [{
            statusCode: '200',
            responseParameters: s3RespMapping,
          }],
        },
      },
    );
    const syllabusFunctions = new SyllabusFunctions(this, 'syllabus-function');
    const courseGetIntegration = new apigw.LambdaIntegration(
      syllabusFunctions.getFunction, { proxy: true },
    );
    const bookPostIntegration = new apigw.LambdaIntegration(
      syllabusFunctions.postFunction, { proxy: true },
    );

    const optionsSyllabusSchools = syllabusSchools.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.OPTIONS, apigw2.HttpMethod.HEAD],
    });
    const getSyllabusSchools = syllabusSchools.addMethod(apigw2.HttpMethod.GET, getIntegration, {
      requestParameters: { ['method.request.path.school']: true },
      operationName: 'GetSyllabusBySchool',
      methodResponses: [{
        statusCode: '200',
        responseModels: { ['application/json']: getRespModel },
        responseParameters: syllabusRespParams,
      }],
      requestValidator: props.validator,
    });
    const headSyllabusSchools = syllabusSchools.addMethod(apigw2.HttpMethod.HEAD, headIntegration, {
      requestParameters: { ['method.request.path.school']: true },
      operationName: 'GetSyllabusMetadataBySchool',
      methodResponses: [{
        statusCode: '200',
        responseParameters: syllabusRespParams,
      }],
      requestValidator: props.validator,
    });

    const optionsSyllabusCourse = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.OPTIONS],
    });
    const getSyllabusCourse = root.addMethod(apigw2.HttpMethod.GET, courseGetIntegration, {
      operationName: 'GetCourse',
      requestParameters: {
        'method.request.querystring.id': true,
      },
      methodResponses: [{
        statusCode: '200',
        responseParameters: lambdaRespParams,
      }],
      requestValidator: props.validator,
    });

    const optionsBookInfo = bookInfo.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.POST, apigw2.HttpMethod.OPTIONS],
    });
    const postBookInfo = bookInfo.addMethod(apigw2.HttpMethod.POST, bookPostIntegration, {
      operationName: 'GetBookInfo',
      methodResponses: [{
        statusCode: '200',
        responseParameters: lambdaRespParams,
      }],
      requestValidator: props.validator,
    });

    this.resourceMapping = {
      '/syllabus': {
        [apigw2.HttpMethod.GET]: getSyllabusCourse,
        [apigw2.HttpMethod.OPTIONS]: optionsSyllabusCourse,
      },
      '/syllabus/{school}': {
        [apigw2.HttpMethod.GET]: getSyllabusSchools,
        [apigw2.HttpMethod.OPTIONS]: optionsSyllabusSchools,
        [apigw2.HttpMethod.HEAD]: headSyllabusSchools,
      },
      '/syllabus/book-info': {
        [apigw2.HttpMethod.POST]: postBookInfo,
        [apigw2.HttpMethod.OPTIONS]: optionsBookInfo,
      },
    };
  }
}

export class CourseReviewsApiService extends RestApiService {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('course-reviews').addResource('{key}');

    const getRespModel = scope.apiEndpoint.addModel('review-get-resp-model', {
      schema: courseReviewGetRespSchema,
      contentType: 'application/json',
      description: 'HTTP GET response body schema for fetching reviews.',
      modelName: 'GetReviewsResp',
    });
    const postReqModel = scope.apiEndpoint.addModel('review-post-req-model', {
      schema: courseReviewPostReqSchema,
      contentType: 'application/json',
      description: 'HTTP POST request body schema for submitting the review.',
      modelName: 'PostReviewReq',
    });
    const patchReqModel = scope.apiEndpoint.addModel('review-patch-req-model', {
      schema: courseReviewPatchReqSchema,
      contentType: 'application/json',
      description: 'HTTP PATCH request body schema for updating a review',
      modelName: 'PatchReviewReq',
    });

    const courseReviewsFunctions = new CourseReviewsFunctions(this, 'crud-functions', {
      envVars: {
        TABLE_NAME: props.dataSource!,
      },
    });
    const getIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.getFunction, { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.postFunction, { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.patchFunction, { proxy: true },
    );
    const deleteIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.deleteFunction, { proxy: true },
    );

    const optionsCourseReviews = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.POST, apigw2.HttpMethod.PATCH, apigw2.HttpMethod.DELETE, apigw2.HttpMethod.OPTIONS],
    });
    const getCourseReviews = root.addMethod(apigw2.HttpMethod.GET, getIntegration,
      {
        requestParameters: {
          'method.request.querystring.uid': false,
        },
        operationName: 'GetReviews',
        methodResponses: [{
          statusCode: '200',
          responseModels: { ['application/json']: getRespModel },
          responseParameters: lambdaRespParams,
        }],
        requestValidator: props.validator,
      },
    );
    const postCourseReviews = root.addMethod(apigw2.HttpMethod.POST, postIntegration,
      {
        operationName: 'PostReview',
        requestModels: { ['application/json']: postReqModel },
        methodResponses: [{
          statusCode: '200',
          responseParameters: lambdaRespParams,
        }],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchCourseReviews = root.addMethod(apigw2.HttpMethod.PATCH, patchIntegration,
      {
        operationName: 'UpdateReview',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        requestModels: { ['application/json']: patchReqModel },
        methodResponses: [{
          statusCode: '200',
          responseParameters: lambdaRespParams,
        }],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const deleteCourseReviews = root.addMethod(apigw2.HttpMethod.DELETE, deleteIntegration,
      {
        operationName: 'DeleteReview',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        methodResponses: [{
          statusCode: '200',
          responseParameters: lambdaRespParams,
        }],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );

    this.resourceMapping = {
      '/course-reviews/{key}': {
        [apigw2.HttpMethod.GET]: getCourseReviews,
        [apigw2.HttpMethod.OPTIONS]: optionsCourseReviews,
        [apigw2.HttpMethod.PATCH]: patchCourseReviews,
        [apigw2.HttpMethod.POST]: postCourseReviews,
        [apigw2.HttpMethod.DELETE]: deleteCourseReviews,
      },
    };
  }
}

export class CareerApiService extends RestApiService {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('career');
    const intern = root.addResource('intern');
    const part = root.addResource('part-time');
    const seminar = root.addResource('seminar');

    const internGetIntegration = new apigw.MockIntegration({
      requestTemplates: { ['application/json']: '{"statusCode": 200}' },
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: { ['application/json']: '{}' },
      }],
    });
    const partGetIntegration = new apigw.MockIntegration({
      requestTemplates: { ['application/json']: '{"statusCode": 200}' },
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: { ['application/json']: '{}' },
      }],
    });
    const seminarGetIntegration = new apigw.MockIntegration({
      requestTemplates: { ['application/json']: '{"statusCode": 200}' },
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [{
        statusCode: '200',
        responseTemplates: { ['application/json']: '{}' },
      }],
    });

    [intern, part, seminar].forEach((value => value.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.OPTIONS],
    })));
    intern.addMethod(apigw2.HttpMethod.GET, internGetIntegration, {
      requestParameters: {
        'method.request.querystring.offset': true,
        'method.request.querystring.limit': true,
        'method.request.querystring.ind': false,
        'method.request.querystring.dl': false,
        'method.request.querystring.lang': false,
      },
      operationName: 'GetInternInfo',
      methodResponses: [{
        statusCode: '200',
        responseModels: { ['application/json']: apigw.Model.EMPTY_MODEL },
        responseParameters: lambdaRespParams,
      }],
      requestValidator: props.validator,
    });
    part.addMethod(apigw2.HttpMethod.GET, partGetIntegration, {
      requestParameters: {
        'method.request.querystring.offset': true,
        'method.request.querystring.limit': true,
        'method.request.querystring.loc': false,
        'method.request.querystring.dl': false,
        'method.request.querystring.lang': false,
        'method.request.querystring.pay': false,
        'method.request.querystring.freq': false,
      },
      operationName: 'GetParttimeInfo',
      methodResponses: [{
        statusCode: '200',
        responseModels: { ['application/json']: apigw.Model.EMPTY_MODEL },
        responseParameters: lambdaRespParams,
      }],
      requestValidator: props.validator,
    });
    seminar.addMethod(apigw2.HttpMethod.GET, seminarGetIntegration, {
      requestParameters: {
        'method.request.querystring.offset': true,
        'method.request.querystring.limit': true,
        'method.request.querystring.ind': false,
        'method.request.querystring.duration': false,
        'method.request.querystring.lang': false,
        'method.request.querystring.dl': false,
        'method.request.querystring.major': false,
      },
      operationName: 'GetSeminarInfo',
      methodResponses: [{
        statusCode: '200',
        responseModels: { ['application/json']: apigw.Model.EMPTY_MODEL },
        responseParameters: lambdaRespParams,
      }],
      requestValidator: props.validator,
    });
  }
}

export class TimetableApiService extends RestApiService {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('timetable');
    const timetableImport = root.addResource('import');
    const timetableExport = root.addResource('export');

    const timetableFunctions = new TimetableFunctions(this, 'crud-functions', {
      envVars: {
        TABLE_NAME: props.dataSource!,
      },
    });
    const getIntegration = new apigw.LambdaIntegration(
      timetableFunctions.getFunction, { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      timetableFunctions.postFunction, { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      timetableFunctions.patchFunction, { proxy: true },
    );
    // const importIntegration = new apigw.LambdaIntegration(
    //     timetableFunctions.importFunction, {proxy: true},
    // );
    // const exportIntegration = new apigw.LambdaIntegration(
    //     timetableFunctions.exportFunction, {proxy: true},
    // );

    const optionsTimetable = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.POST, apigw2.HttpMethod.PATCH, apigw2.HttpMethod.OPTIONS, apigw2.HttpMethod.DELETE],
    });
    const getTimetable = root.addMethod(apigw2.HttpMethod.GET, getIntegration, {
      operationName: 'GetTimetable',
      methodResponses: [{
        statusCode: '200',
        responseParameters: lambdaRespParams,
      }],
      authorizer: props.authorizer,
      requestValidator: props.validator,
    });
    const postTimetable = root.addMethod(apigw2.HttpMethod.POST, postIntegration, {
      operationName: 'PostTimetable',
      methodResponses: [{
        statusCode: '200',
        responseParameters: lambdaRespParams,
      }],
      authorizer: props.authorizer,
      requestValidator: props.validator,
    });
    const patchTimetable = root.addMethod(apigw2.HttpMethod.PATCH, patchIntegration, {
      operationName: 'UpdateTimetable',
      methodResponses: [{
        statusCode: '200',
        responseParameters: lambdaRespParams,
      }],
      authorizer: props.authorizer,
      requestValidator: props.validator,
    });

    // [timetableImport, timetableExport].forEach(value => value.addCorsPreflight({
    //     allowOrigins: allowOrigins,
    //     allowHeaders: allowHeaders,
    //     allowMethods: [apigw2.HttpMethod.POST, apigw2.HttpMethod.OPTIONS],
    // }));
    // const importTimetable = timetableImport.addMethod(apigw2.HttpMethod.POST, importIntegration, {
    //     operationName: "ImportTimetable",
    //     methodResponses: [{
    //         statusCode: '200',
    //         responseParameters: lambdaRespParams,
    //     }],
    //     requestValidator: props.validator,
    // });
    // const exportTimetable = timetableExport.addMethod(apigw2.HttpMethod.POST, exportIntegration, {
    //     operationName: "ExportTimetable",
    //     methodResponses: [{
    //         statusCode: '200',
    //         responseParameters: lambdaRespParams,
    //     }],
    //     requestValidator: props.validator,
    // });

    this.resourceMapping = {
      '/timetable': {
        [apigw2.HttpMethod.OPTIONS]: optionsTimetable,
        [apigw2.HttpMethod.GET]: getTimetable,
        [apigw2.HttpMethod.PATCH]: patchTimetable,
        [apigw2.HttpMethod.POST]: postTimetable,
      },
      // "/timetable/export": {
      //     [apigw2.HttpMethod.POST]: exportTimetable,
      // },
      // "/timetable/import": {
      //     [apigw2.HttpMethod.POST]: importTimetable,
      // },
    };
  }
}

export class GraphqlApiService extends RestApiService {
  readonly resourceMapping: { [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method } };

  constructor(scope: AbstractRestApiEndpoint, id: string, props: RestApiServiceProps) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('graphql');

    const postIntegration = new apigw.HttpIntegration(props.dataSource!, {
      proxy: true,
      httpMethod: apigw2.HttpMethod.POST,
    });

    const optionsGql = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.POST, apigw2.HttpMethod.OPTIONS],
    });
    const postGql = root.addMethod(apigw2.HttpMethod.POST, postIntegration, {
      operationName: 'PostGraphQL',
      methodResponses: [{
        statusCode: '200',
      }],
    });

    this.resourceMapping = {
      '/graphql': {
        [apigw2.HttpMethod.OPTIONS]: optionsGql,
        [apigw2.HttpMethod.POST]: postGql,
      },
    };
  }
}
