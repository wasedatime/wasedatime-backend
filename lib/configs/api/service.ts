import {
    CareerApiService,
    CourseReviewsApiService,
    FeedsApiService,
    SyllabusApiService,
    TimetableApiService,
} from "../../constructs/business/api-service";

export enum ApiEndpoint {

    MAIN,

    AUTH
}

export const apiServiceMap: { [name: string]: any } = {
    "syllabus": SyllabusApiService,

    "course-reviews": CourseReviewsApiService,

    "career": CareerApiService,

    "feeds": FeedsApiService,

    "timetable": TimetableApiService,
};