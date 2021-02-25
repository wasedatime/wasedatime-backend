import {
    CareerApiService,
    CourseReviewsApiService,
    FeedsApiService,
    SyllabusApiService,
    TimetableApiService
} from "../../constructs/business/api-service";

export enum ApiEndpoint {

    MAIN,

    AUTH
}

export const apiServiceMap: { [name: string]: any } = {
    "SYLLABUS": SyllabusApiService,

    "COURSE_REVIEW": CourseReviewsApiService,

    "CAREER": CareerApiService,

    "FEEDS": FeedsApiService,

    "TIMETABLE": TimetableApiService
};