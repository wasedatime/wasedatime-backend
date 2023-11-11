import * as apigw2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

import { allowHeaders, allowOrigins } from '../../configs/api-gateway/cors';
import {
  lambdaRespParams,
  s3RespMapping,
  syllabusRespParams,
} from '../../configs/api-gateway/mapping';
import {
  courseReviewGetRespSchema,
  courseReviewPatchReqSchema,
  courseReviewPostReqSchema,
  forumThreadGetRespSchema,
  forumThreadPatchReqSchema,
  forumThreadPostReqSchema,
  forumCommentGetRespSchema,
  forumCommentPostReqSchema,
  forumCommentPatchReqSchema,
  syllabusSchema,
  userProfileGetRespSchema,
  userProfilePostReqSchema,
  userProfilePatchReqSchema,
} from '../../configs/api-gateway/schema';
import { AwsServicePrincipal } from '../../configs/common/aws';
import {
  CourseReviewsFunctions,
  SyllabusFunctions,
  TimetableFunctions,
  ForumThreadFunctions,
  ForumCommentFunctions,
  AdsImageProcessFunctionsAPI,
  CareerRestFunctions,
  ProfileProcessFunctions,
} from '../common/lambda-functions';
import { AbstractRestApiEndpoint } from './api-endpoint';

export interface RestApiServiceProps {
  dataSource?: string;
  authorizer?: apigw.IAuthorizer;
  validator?: apigw.RequestValidator;
}

export class RestApiService extends Construct {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id);
  }
}

export class ForumAdsApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    // Create resources for the api
    const root = scope.apiEndpoint.root.addResource('adsImgs');

    const adsImageProcessFunctionsAPI = new AdsImageProcessFunctionsAPI(
      this,
      'crud-functions',
      {
        envVars: {
          TABLE_NAME: props.dataSource!,
          BUCKET_NAME: 'wasedatime-ads',
        },
      },
    );

    const getIntegration = new apigw.LambdaIntegration(
      adsImageProcessFunctionsAPI.getFunction,
      { proxy: true },
    );

    const optionsAdsImgs = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.POST],
    });

    const getAds = root.addMethod(apigw2.HttpMethod.GET, getIntegration, {
      operationName: 'GetAds',
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: lambdaRespParams,
        },
      ],
      requestValidator: props.validator,
    });

    this.resourceMapping = {
      '/adsImgs': {
        [apigw2.HttpMethod.GET]: getAds,
        [apigw2.HttpMethod.OPTIONS]: optionsAdsImgs,
      },
    };
  }
}
export class SyllabusApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
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
      path: `/service-role/${AwsServicePrincipal.API_GATEWAY}/`,
      roleName: 's3-apigateway-read',
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          's3-read-only',
          'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
        ),
      ],
    });

    const getIntegration = new apigw.AwsIntegration({
      service: 's3',
      integrationHttpMethod: apigw2.HttpMethod.GET,
      path: 'syllabus/{school}.json',
      subdomain: props.dataSource,
      options: {
        credentialsRole: apiGatewayRole,
        requestParameters: {
          ['integration.request.path.school']: 'method.request.path.school',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: s3RespMapping,
          },
        ],
      },
    });

    const headIntegration = new apigw.AwsIntegration({
      service: 's3',
      integrationHttpMethod: apigw2.HttpMethod.HEAD,
      path: 'syllabus/{school}.json',
      subdomain: props.dataSource,
      options: {
        credentialsRole: apiGatewayRole,
        requestParameters: {
          ['integration.request.path.school']: 'method.request.path.school',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: s3RespMapping,
          },
        ],
      },
    });
    const syllabusFunctions = new SyllabusFunctions(this, 'syllabus-function');
    const courseGetIntegration = new apigw.LambdaIntegration(
      syllabusFunctions.getFunction,
      { proxy: true },
    );
    const bookPostIntegration = new apigw.LambdaIntegration(
      syllabusFunctions.postFunction,
      { proxy: true },
    );

    const optionsSyllabusSchools = syllabusSchools.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.OPTIONS,
        apigw2.HttpMethod.HEAD,
      ],
    });
    const getSyllabusSchools = syllabusSchools.addMethod(
      apigw2.HttpMethod.GET,
      getIntegration,
      {
        requestParameters: { ['method.request.path.school']: true },
        operationName: 'GetSyllabusBySchool',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: syllabusRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );
    const headSyllabusSchools = syllabusSchools.addMethod(
      apigw2.HttpMethod.HEAD,
      headIntegration,
      {
        requestParameters: { ['method.request.path.school']: true },
        operationName: 'GetSyllabusMetadataBySchool',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: syllabusRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );

    const optionsSyllabusCourse = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET, apigw2.HttpMethod.OPTIONS],
    });
    const getSyllabusCourse = root.addMethod(
      apigw2.HttpMethod.GET,
      courseGetIntegration,
      {
        operationName: 'GetCourse',
        requestParameters: {
          'method.request.querystring.id': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );

    const optionsBookInfo = bookInfo.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.POST, apigw2.HttpMethod.OPTIONS],
    });
    const postBookInfo = bookInfo.addMethod(
      apigw2.HttpMethod.POST,
      bookPostIntegration,
      {
        operationName: 'GetBookInfo',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );

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
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root
      .addResource('course-reviews')
      .addResource('{key}');

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

    const courseReviewsFunctions = new CourseReviewsFunctions(
      this,
      'crud-functions',
      {
        envVars: {
          TABLE_NAME: props.dataSource!,
        },
      },
    );
    const getIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.getFunction,
      { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.postFunction,
      { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.patchFunction,
      { proxy: true },
    );
    const deleteIntegration = new apigw.LambdaIntegration(
      courseReviewsFunctions.deleteFunction,
      { proxy: true },
    );

    const optionsCourseReviews = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });
    const getCourseReviews = root.addMethod(
      apigw2.HttpMethod.GET,
      getIntegration,
      {
        requestParameters: {
          'method.request.querystring.uid': false,
        },
        operationName: 'GetReviews',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );
    const postCourseReviews = root.addMethod(
      apigw2.HttpMethod.POST,
      postIntegration,
      {
        operationName: 'PostReview',
        requestModels: { ['application/json']: postReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchCourseReviews = root.addMethod(
      apigw2.HttpMethod.PATCH,
      patchIntegration,
      {
        operationName: 'UpdateReview',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        requestModels: { ['application/json']: patchReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const deleteCourseReviews = root.addMethod(
      apigw2.HttpMethod.DELETE,
      deleteIntegration,
      {
        operationName: 'DeleteReview',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
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
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('career');

    const careerFunctions = new CareerRestFunctions(this, 'crud-functions', {
      envVars: {
        TABLE_NAME: props.dataSource!,
        BUCKET_NAME: 'wasedatime-career',
      },
    });
    const getIntegration = new apigw.LambdaIntegration(
      careerFunctions.getFunction,
      { proxy: true },
    );

    const optionsCareer = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });
    const getCareer = root.addMethod(apigw2.HttpMethod.GET, getIntegration, {
      operationName: 'GetReviews',
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: lambdaRespParams,
        },
      ],
      requestValidator: props.validator,
    });

    this.resourceMapping = {
      '/career': {
        [apigw2.HttpMethod.GET]: getCareer,
        [apigw2.HttpMethod.OPTIONS]: optionsCareer,
      },
    };
  }
}

export class TimetableApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
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
      timetableFunctions.getFunction,
      { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      timetableFunctions.postFunction,
      { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      timetableFunctions.patchFunction,
      { proxy: true },
    );
    const putIntergation = new apigw.LambdaIntegration(
      timetableFunctions.putFunction,
      { proxy: true },
    );
    // const importIntegration = new apigw.LambdaIntegration(
    //     timetableFunctions.importFunction, {proxy: true},
    // );
    // const exportIntegration = new apigw.LambdaIntegration(
    //     timetableFunctions.exportFunction, {proxy: true},
    // );

    // , apigw2.HttpMethod.DELETE

    const optionsTimetable = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.PUT,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.OPTIONS,
      ],
    });
    const getTimetable = root.addMethod(apigw2.HttpMethod.GET, getIntegration, {
      operationName: 'GetTimetable',
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: lambdaRespParams,
        },
      ],
      authorizer: props.authorizer,
      requestValidator: props.validator,
    });
    const postTimetable = root.addMethod(
      apigw2.HttpMethod.POST,
      postIntegration,
      {
        operationName: 'PostTimetable',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchTimetable = root.addMethod(
      apigw2.HttpMethod.PATCH,
      patchIntegration,
      {
        operationName: 'UpdateTimetable',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const putTimetable = root.addMethod(apigw2.HttpMethod.PUT, putIntergation, {
      operationName: 'PutTimetable',
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: lambdaRespParams,
        },
      ],
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
        [apigw2.HttpMethod.PUT]: putTimetable,
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
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
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
      methodResponses: [
        {
          statusCode: '200',
        },
      ],
    });

    this.resourceMapping = {
      '/graphql': {
        [apigw2.HttpMethod.OPTIONS]: optionsGql,
        [apigw2.HttpMethod.POST]: postGql,
      },
    };
  }
}

export class ForumThreadsApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('forum');
    const boardResource = root.addResource('{board_id}');
    const threadResource = boardResource.addResource('{thread_id}');
    const userResource = root.addResource('user');
    const testResource = root.addResource('test');
    const notificationResource = root.addResource('notify');

    const optionsForumHome = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const optionsForumBoards = boardResource.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const optionsForumThreads = threadResource.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const optionsUserThreads = userResource.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const optionsTestThreads = testResource.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const optionsNotifyThreads = notificationResource.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [apigw2.HttpMethod.GET],
    });

    const getRespModel = scope.apiEndpoint.addModel('threads-get-resp-model', {
      schema: forumThreadGetRespSchema,
      contentType: 'application/json',
      description: 'HTTP GET response body schema for fetching threads.',
      modelName: 'GetThreadsResp',
    });
    const postReqModel = scope.apiEndpoint.addModel('thread-post-req-model', {
      schema: forumThreadPostReqSchema,
      contentType: 'application/json',
      description: 'HTTP POST request body schema for submitting a thread.',
      modelName: 'PostThreadReq',
    });
    const patchReqModel = scope.apiEndpoint.addModel('thread-patch-req-model', {
      schema: forumThreadPatchReqSchema,
      contentType: 'application/json',
      description: 'HTTP PATCH request body schema for updating a thread',
      modelName: 'PatchThreadReq',
    });

    const forumThreadsFunctions = new ForumThreadFunctions(
      this,
      'crud-functions',
      {
        envVars: {
          TABLE_NAME: props.dataSource!,
          BUCKET_NAME: 'wasedatime-thread-img',
        },
      },
    );

    const getAllInegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.getAllFunction,
      { proxy: true },
    );
    const getUserIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.getUserFunction,
      { proxy: true },
    );
    const getThreadIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.getSingleFunction,
      { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.postFunction,
      { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.patchFunction,
      { proxy: true },
    );
    const deleteIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.deleteFunction,
      { proxy: true },
    );
    const notifyIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.getNotificationFunction,
      { proxy: true },
    );
    const testPostIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.testPostFunction,
      { proxy: true },
    );
    const testGetIntegration = new apigw.LambdaIntegration(
      forumThreadsFunctions.testGetFunction,
      { proxy: true },
    );

    const getAllForumThreads = root.addMethod(
      apigw2.HttpMethod.GET,
      getAllInegration,
      {
        operationName: 'GetAllThreads',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );

    const getUserForumThreads = userResource.addMethod(
      apigw2.HttpMethod.GET,
      getUserIntegration,
      {
        operationName: 'GetUserThreads',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: apigw.Model.EMPTY_MODEL },
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );

    const getForumThread = threadResource.addMethod(
      apigw2.HttpMethod.GET,
      getThreadIntegration,
      {
        requestParameters: {
          'method.request.path.thread_id': true,
        },
        operationName: 'GetSingleThread',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );
    const postForumThreads = boardResource.addMethod(
      apigw2.HttpMethod.POST,
      postIntegration,
      {
        operationName: 'PostThread',
        requestModels: { ['application/json']: postReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchForumThreads = threadResource.addMethod(
      apigw2.HttpMethod.PATCH,
      patchIntegration,
      {
        operationName: 'UpdateThread',
        requestModels: { ['application/json']: patchReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const deleteForumThreads = threadResource.addMethod(
      apigw2.HttpMethod.DELETE,
      deleteIntegration,
      {
        operationName: 'DeleteThread',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const notifyForumThreads = notificationResource.addMethod(
      apigw2.HttpMethod.GET,
      notifyIntegration,
      {
        operationName: 'NotifyThreadCount',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );
    const testPostForumThreads = testResource.addMethod(
      apigw2.HttpMethod.POST,
      testPostIntegration,
      {
        operationName: 'testPostThread',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );

    const testGetForumThreads = testResource.addMethod(
      apigw2.HttpMethod.GET,
      testGetIntegration,
      {
        operationName: 'testGetThread',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );

    this.resourceMapping = {
      '/forum': {
        [apigw2.HttpMethod.GET]: getAllForumThreads,
        [apigw2.HttpMethod.OPTIONS]: optionsForumHome,
      },
      '/forum/user': {
        [apigw2.HttpMethod.GET]: getUserForumThreads,
        [apigw2.HttpMethod.OPTIONS]: optionsUserThreads,
      },
      '/forum/notify': {
        [apigw2.HttpMethod.GET]: notifyForumThreads,
        [apigw2.HttpMethod.OPTIONS]: optionsNotifyThreads,
      },
      '/forum/{board_id}': {
        [apigw2.HttpMethod.POST]: postForumThreads,
        [apigw2.HttpMethod.OPTIONS]: optionsForumBoards,
      },
      '/forum/{board_id}/{thread_id}': {
        [apigw2.HttpMethod.GET]: getForumThread,
        [apigw2.HttpMethod.OPTIONS]: optionsForumThreads,
        [apigw2.HttpMethod.PATCH]: patchForumThreads,
        [apigw2.HttpMethod.DELETE]: deleteForumThreads,
      },
      '/forum/test': {
        [apigw2.HttpMethod.POST]: testPostForumThreads,
        [apigw2.HttpMethod.GET]: testGetForumThreads,
        [apigw2.HttpMethod.OPTIONS]: optionsTestThreads,
      },
    };
  }
}

export class ForumCommentsApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root
      .addResource('forum-comment')
      .addResource('{thread_id}');

    const optionsForumThreadComment = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const forumCommentsFunctions = new ForumCommentFunctions(
      this,
      'crud-functions',
      {
        envVars: {
          TABLE_NAME: props.dataSource!,
        },
      },
    );

    const getIntegration = new apigw.LambdaIntegration(
      forumCommentsFunctions.getFunction,
      { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      forumCommentsFunctions.postFunction,
      { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      forumCommentsFunctions.patchFunction,
      { proxy: true },
    );
    const deleteIntegration = new apigw.LambdaIntegration(
      forumCommentsFunctions.deleteFunction,
      { proxy: true },
    );

    const getRespModel = scope.apiEndpoint.addModel('comment-get-resp-model', {
      schema: forumCommentGetRespSchema,
      contentType: 'application/json',
      description:
        'HTTP GET response body schema for fetching a comment of a thread.',
      modelName: 'GetCommentsResp',
    });
    const postReqModel = scope.apiEndpoint.addModel('comment-post-req-model', {
      schema: forumCommentPostReqSchema,
      contentType: 'application/json',
      description:
        'HTTP POST request body schema for submitting a comment of a thread.',
      modelName: 'PostCommentReq',
    });
    const patchReqModel = scope.apiEndpoint.addModel(
      'comment-patch-req-model',
      {
        schema: forumCommentPatchReqSchema,
        contentType: 'application/json',
        description:
          'HTTP PATCH request body schema for updating a comment of a thread',
        modelName: 'PatchCommentReq',
      },
    );

    const getForumComments = root.addMethod(
      apigw2.HttpMethod.GET,
      getIntegration,
      {
        requestParameters: {
          'method.request.querystring.uid': false,
        },
        operationName: 'GetComments',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: lambdaRespParams,
          },
        ],
        requestValidator: props.validator,
      },
    );
    const postForumComment = root.addMethod(
      apigw2.HttpMethod.POST,
      postIntegration,
      {
        operationName: 'PostComment',
        requestModels: { ['application/json']: postReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchForumComment = root.addMethod(
      apigw2.HttpMethod.PATCH,
      patchIntegration,
      {
        operationName: 'UpdateComment',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        requestModels: { ['application/json']: patchReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const deleteForumComment = root.addMethod(
      apigw2.HttpMethod.DELETE,
      deleteIntegration,
      {
        operationName: 'DeleteComment',
        requestParameters: {
          'method.request.querystring.ts': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );

    this.resourceMapping = {
      '/forum-comment/{thread_id}': {
        [apigw2.HttpMethod.GET]: getForumComments,
        [apigw2.HttpMethod.OPTIONS]: optionsForumThreadComment,
        [apigw2.HttpMethod.PATCH]: patchForumComment,
        [apigw2.HttpMethod.POST]: postForumComment,
        [apigw2.HttpMethod.DELETE]: deleteForumComment,
      },
    };
  }
}

export class ProfileProcessApiService extends RestApiService {
  readonly resourceMapping: {
    [path: string]: { [method in apigw2.HttpMethod]?: apigw.Method };
  };

  constructor(
    scope: AbstractRestApiEndpoint,
    id: string,
    props: RestApiServiceProps,
  ) {
    super(scope, id, props);

    const root = scope.apiEndpoint.root.addResource('profile');

    const optionsProfileProcess = root.addCorsPreflight({
      allowOrigins: allowOrigins,
      allowHeaders: allowHeaders,
      allowMethods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PATCH,
        apigw2.HttpMethod.DELETE,
        apigw2.HttpMethod.OPTIONS,
      ],
    });

    const profileProcessFunctions = new ProfileProcessFunctions(
      this,
      'crud-functions',
      {
        envVars: {
          TABLE_NAME: props.dataSource!,
        },
      },
    );

    const getIntegration = new apigw.LambdaIntegration(
      profileProcessFunctions.getFunction,
      { proxy: true },
    );
    const postIntegration = new apigw.LambdaIntegration(
      profileProcessFunctions.postFunction,
      { proxy: true },
    );
    const patchIntegration = new apigw.LambdaIntegration(
      profileProcessFunctions.patchFunction,
      { proxy: true },
    );
    const deleteIntegration = new apigw.LambdaIntegration(
      profileProcessFunctions.deleteFunction,
      { proxy: true },
    );
    // bug fixed
    const getRespModel = scope.apiEndpoint.addModel('profile-get-resp-model', {
      schema: userProfileGetRespSchema,
      contentType: 'application/json',
      description: 'HTTP GET response body schema for fetching user profile.',
      modelName: 'GetProfileResp',
    });
    const postReqModel = scope.apiEndpoint.addModel('profile-post-req-model', {
      schema: userProfilePostReqSchema,
      contentType: 'application/json',
      description:
        'HTTP POST request body schema for submitting a user profile.',
      modelName: 'PostProfileReq',
    });
    const patchReqModel = scope.apiEndpoint.addModel(
      'profile-patch-req-model',
      {
        schema: userProfilePatchReqSchema,
        contentType: 'application/json',
        description:
          'HTTP PATCH request body schema for updating a user profile',
        modelName: 'PatchProfileReq',
      },
    );

    const getUserProfile = root.addMethod(
      apigw2.HttpMethod.GET,
      getIntegration,
      {
        operationName: 'GetUserProfile',
        methodResponses: [
          {
            statusCode: '200',
            responseModels: { ['application/json']: getRespModel },
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const postUserProfile = root.addMethod(
      apigw2.HttpMethod.POST,
      postIntegration,
      {
        operationName: 'PostUserProfile',
        requestModels: { ['application/json']: postReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const patchUserProfile = root.addMethod(
      apigw2.HttpMethod.PATCH,
      patchIntegration,
      {
        operationName: 'UpdateUseProfile',
        requestModels: { ['application/json']: patchReqModel },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );
    const deleteUserProfile = root.addMethod(
      apigw2.HttpMethod.DELETE,
      deleteIntegration,
      {
        operationName: 'DeleteUserProfile',
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: lambdaRespParams,
          },
        ],
        authorizer: props.authorizer,
        requestValidator: props.validator,
      },
    );

    this.resourceMapping = {
      '/profile': {
        [apigw2.HttpMethod.GET]: getUserProfile,
        [apigw2.HttpMethod.OPTIONS]: optionsProfileProcess,
        [apigw2.HttpMethod.PATCH]: patchUserProfile,
        [apigw2.HttpMethod.POST]: postUserProfile,
        [apigw2.HttpMethod.DELETE]: deleteUserProfile,
      },
    };
  }
}
