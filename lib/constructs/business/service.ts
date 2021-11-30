import * as rest from "./rest-api-service";
import * as gql from "./graphql-api-service";

export enum ApiEndpoint {
    REST,
    AUTH,
    GRAPHQL,
}

export const apiServiceMap: { [name: string]: any } = {
    "syllabus": rest.SyllabusApiService,
    "course-reviews": rest.CourseReviewsApiService,
    "career": rest.CareerApiService,
    "timetable": rest.TimetableApiService,
    "graphql": rest.GraphqlApiService,
    "course": gql.CourseApiService,
};
