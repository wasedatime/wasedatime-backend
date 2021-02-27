import * as rest from "../../constructs/business/api-service";
import * as gql from "../../constructs/business/graphql-api-service";

export enum ApiEndpoint {

    REST,

    AUTH,

    GRAPHQL,
}

export const apiServiceMap: { [name: string]: any } = {

    "syllabus": rest.SyllabusApiService,

    "course-reviews": rest.CourseReviewsApiService,

    "career": rest.CareerApiService,

    "feeds": rest.FeedsApiService,

    "timetable": rest.TimetableApiService,

    "course": gql.CourseApiService,
};