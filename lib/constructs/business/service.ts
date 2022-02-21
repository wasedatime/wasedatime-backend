import * as gql from './graphql-api-service';
import * as rest from './rest-api-service';

export enum ApiEndpoint {
  REST,
  AUTH,
  GRAPHQL,
}

export type RestApiServiceId = 'syllabus' | 'course-reviews' | 'career' | 'timetable' | 'graphql';

export const restApiServiceMap: { [name in RestApiServiceId]: typeof rest.RestApiService } = {
  'syllabus': rest.SyllabusApiService,
  'course-reviews': rest.CourseReviewsApiService,
  'career': rest.CareerApiService,
  'timetable': rest.TimetableApiService,
  'graphql': rest.GraphqlApiService,
};

export type GraphqlApiServiceId = 'course';

export const graphqlApiServiceMap: { [name in GraphqlApiServiceId]: typeof gql.GraphqlApiService } = {
  course: gql.CourseApiService,
};
