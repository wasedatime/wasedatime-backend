import {JsonSchema, JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";


export const syllabusSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    id: "https://api.wasedatime.com/schemas/syllabus.json",
    type: JsonSchemaType.ARRAY,
    title: "Syllabus",
    description: "The new syllabus JSON schema for each school.",
    items: {
        id: "#/items",
        type: JsonSchemaType.OBJECT,
        title: "Items",
        description: "The schema of each course in the array.",
        required: [
            "a",
            "b",
            "c",
            "d",
            "e",
            "f",
            "g",
            "h",
            "i",
            "j",
            "k",
            "l",
            "m",
            "n",
            "o",
            "p",
            "q"
        ],
        properties: {
            "a": {
                id: "#/items/properties/a",
                type: JsonSchemaType.STRING,
                title: "Course Key",
                description: "Course key of the course."
            },
            "b": {
                id: "#/items/properties/b",
                type: JsonSchemaType.STRING,
                title: "Title",
                description: "Course title in English."
            },
            "c": {
                id: "#/items/properties/c",
                type: JsonSchemaType.STRING,
                title: "Title JP",
                description: "Course title in Japanese."
            },
            "d": {
                id: "#/items/properties/d",
                type: JsonSchemaType.STRING,
                title: "Instructor",
                description: "Instructor's name in English."
            },
            "e": {
                id: "#/items/properties/e",
                type: JsonSchemaType.STRING,
                title: "Instructor JP",
                description: "Instructor's name in Japanese."
            },
            "f": {
                id: "#/items/properties/f",
                type: JsonSchemaType.ARRAY,
                title: "Langauges",
                description: "Languages in which the course is taught.",
                items: {
                    id: "#/items/properties/f/items",
                    type: JsonSchemaType.INTEGER,
                    title: "Language",
                    description: "-1 N/A | 0 Japanese | 1 English | 2 German | 3 French | 4 Chinese | 5 Spanish | 6 Korean | 7 Russia | 8 Italian | 9 other",
                    enum: [
                        -1,
                        0,
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7,
                        8,
                        9
                    ]
                }
            },
            "g": {
                id: "#/items/properties/g",
                type: JsonSchemaType.INTEGER,
                title: "Type",
                description: "Type of the course\n-1 N/A | 0 Lecture | 1 Seminar | 2 Work | 3 Foreign Langauge | 4 On-demand | 5 Thesis | 6 Graduate Research | 7 Practice | 8 Blended",
                enum: [
                    -1,
                    0,
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8
                ]
            },
            "h": {
                id: "#/items/properties/h",
                type: JsonSchemaType.STRING,
                title: "Term",
                description: "The term in which the course is taught.\nseason := 0 Spring | 1 Summer | 2 Fall | 3 Winter\nperiod := 's' Semester| 'q' Quarter | 'i' Intensive Course | 'f' Full Year | 't' Term\ndelimiter := '/' or | '&' and",
                enum: [
                    "0s",
                    "2s",
                    "0q",
                    "1q",
                    "2q",
                    "3q",
                    "f",
                    "0",
                    "1",
                    "2",
                    "3",
                    "0i",
                    "2i",
                    "0t",
                    "2t",
                    "3t",
                    "0t/1t",
                    "0s/2s",
                    "2t/3t",
                    "1&2s",
                    "0s&1",
                    "f/2s",
                    "0i&3i"
                ]
            },
            "i": {
                id: "#/items/properties/i",
                type: JsonSchemaType.ARRAY,
                title: "Occurrences",
                description: "The schedules and locations of the course.",
                items: {
                    id: "#/items/properties/i/items",
                    type: JsonSchemaType.OBJECT,
                    title: "Occurrence",
                    description: "Schedule and location",
                    required: [
                        "d",
                        "p",
                        "l"
                    ],
                    properties: {
                        "d": {
                            id: "#/items/properties/i/items/properties/d",
                            type: JsonSchemaType.INTEGER,
                            title: "Day",
                            description: "The day on which the course is taught.\n-1 others | 0 Mon | 1 Tues | 2 Wed | 3 Thur | 4 Fri | 5 Sat | 6 Sun",
                            enum: [
                                -1,
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6
                            ]
                        },
                        "p": {
                            id: "#/items/properties/i/items/properties/p",
                            type: JsonSchemaType.INTEGER,
                            title: "Period",
                            description: "The period on which the course is taught.\nstart_period := -1 others | 0 On-demand | 1 .. 9\n end_period := start_period "
                        },
                        "l": {
                            id: "#/items/properties/i/items/properties/l",
                            type: JsonSchemaType.STRING,
                            title: "Loction",
                            description: "The location where the course takes place."
                        }
                    }
                }
            },
            "j": {
                id: "#/items/properties/j",
                type: JsonSchemaType.INTEGER,
                title: "Minimum Eligible Year",
                description: "Minimum eligible year.\n-1 unknown | 1 .. 4",
                enum: [
                    -1,
                    1,
                    2,
                    3,
                    4
                ]
            },
            "k": {
                id: "#/items/properties/k",
                type: JsonSchemaType.STRING,
                title: "Category",
                description: "The category the course falls in."
            },
            "l": {
                id: "#/items/properties/l",
                type: JsonSchemaType.INTEGER,
                title: "Credit",
                description: "The credit of the course.\n -1 unknown | 0 .."
            },
            "m": {
                id: "#/items/properties/m",
                type: JsonSchemaType.INTEGER,
                title: "Level",
                description: "The level/difficulty of the course.\n-1 N/A | 0 Beginner | 1 Intermediate | 2 Advanced | 3 Final-stage | 4 Master | 5 Doctor",
                enum: [
                    -1,
                    0,
                    1,
                    2,
                    3,
                    4,
                    5
                ]
            },
            "n": {
                id: "#/items/properties/n",
                type: JsonSchemaType.ARRAY,
                title: "Evaluations",
                description: "The distribution of evaluation criterion and their descriptions",
                items: {
                    id: "#/items/properties/n/items",
                    type: JsonSchemaType.OBJECT,
                    title: "Evaluation",
                    description: "Criteria and description",
                    required: [
                        "t",
                        "p",
                        "c"
                    ],
                    properties: {
                        "t": {
                            id: "#/items/properties/n/items/properties/t",
                            type: JsonSchemaType.INTEGER,
                            title: "Type",
                            description: "Type of the evaluation\n-1 Unknown | 0 Exam | 1 Papers | 2 Class Participation | 3 Others",
                            enum: [
                                -1,
                                0,
                                1,
                                2,
                                3
                            ]
                        },
                        "p": {
                            id: "#/items/properties/n/items/properties/p",
                            type: JsonSchemaType.INTEGER,
                            title: "Percentage",
                            description: "The percentage of this criteria in evaluation."
                        },
                        "c": {
                            id: "#/items/properties/n/items/properties/c",
                            type: JsonSchemaType.STRING,
                            title: "Comment",
                            description: "An explanation about the criteria."
                        }
                    }
                }
            },
            "o": {
                id: "#/items/properties/o",
                type: JsonSchemaType.STRING,
                title: "Code",
                description: "Course code"
            },
            "p": {
                id: "#/items/properties/p",
                type: JsonSchemaType.STRING,
                title: "Subtitle",
                description: "Subtitle of the course (often seen in seminar courses)"
            },
            "q": {
                id: "#/items/properties/q",
                type: JsonSchemaType.STRING,
                title: "CategoryJP",
                description: "The category the course falls in.(in Japanese)"
            }
        }
    }
};
export const courseReviewReqSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    id: "https://api.wasedatime.com/schemas/course_reviews.json",
    type: JsonSchemaType.OBJECT,
    title: "CourseReview",
    description: "HTTP POST request body for fetching reviews for several courses",
    properties: {
        "course_keys": {
            id: "#/properties/course_keys",
            type: JsonSchemaType.ARRAY,
            title: "CourseKeys",
            description: "An array of course keys for which review is to be fetched",
            items: {
                id: "#/items",
                title: "Items",
                type: JsonSchemaType.STRING,
                description: "course key items"
            }
        }
    },
    required: [
        "course_keys"
    ]
};

// todo
export const courseReviewRespSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    type: JsonSchemaType.OBJECT,
    properties: {
        "success": {
            type: JsonSchemaType.BOOLEAN
        },
        "data": {
            type: JsonSchemaType.ARRAY,
            items: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    "course_key": {
                        type: JsonSchemaType.STRING
                    },
                    "comments": {
                        type: JsonSchemaType.ARRAY,
                        items: {
                            type: JsonSchemaType.OBJECT,
                            properties: {
                                "title_jp": {
                                    type: JsonSchemaType.STRING
                                },
                                "instructor_jp": {
                                    type: JsonSchemaType.STRING
                                },
                                "course_code": {
                                    type: JsonSchemaType.STRING
                                },
                                "updated_at": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "created_at": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "benefit": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "difficulty": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "satisfaction": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "instructor": {
                                    type: JsonSchemaType.STRING
                                },
                                "comment_zh_CN": {
                                    type: JsonSchemaType.STRING
                                },
                                "comment_en": {
                                    type: JsonSchemaType.STRING
                                },
                                "year": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "comment_src_lng": {
                                    type: JsonSchemaType.INTEGER
                                },
                                "comment_jp": {
                                    type: JsonSchemaType.STRING
                                },
                                "course_key": {
                                    type: JsonSchemaType.STRING
                                },
                                "comment_zh_TW": {
                                    type: JsonSchemaType.STRING
                                },
                                "title": {
                                    type: JsonSchemaType.STRING
                                }
                            },
                            required: [
                                "title_jp",
                                "instructor_jp",
                                "course_code",
                                "updated_at",
                                "created_at",
                                "benefit",
                                "difficulty",
                                "satisfaction",
                                "instructor",
                                "comment_zh_CN",
                                "comment_zh_TW",
                                "comment_en",
                                "year",
                                "comment_src_lng",
                                "comment_jp",
                                "course_key",
                                "title"
                            ]
                        }
                    }
                },
                required: [
                    "course_key",
                    "comments"
                ]
            }
        },
        "message": {
            type: JsonSchemaType.STRING
        }
    },
    required: [
        "success",
        "data",
        "message"
    ]
};

export const articleListSchema: JsonSchema = {
    schema: JsonSchemaVersion.DRAFT7,
    type: JsonSchemaType.OBJECT,
    properties: {
        "success": {
            type: JsonSchemaType.BOOLEAN
        },
        "data": {
            type: JsonSchemaType.OBJECT,
            properties: {
                "articles": {
                    type: JsonSchemaType.ARRAY,
                    items: {
                        type: JsonSchemaType.OBJECT,
                        properties: {
                            "category": {
                                type: JsonSchemaType.STRING
                            },
                            "title": {
                                type: JsonSchemaType.STRING
                            },
                            "author": {
                                type: JsonSchemaType.STRING
                            },
                            "summary": {
                                type: JsonSchemaType.STRING
                            },
                            "date_created": {
                                type: JsonSchemaType.STRING
                            },
                            "last_modified": {
                                type: JsonSchemaType.STRING
                            },
                            "tags": {
                                type: JsonSchemaType.ARRAY,
                                items: {
                                    type: JsonSchemaType.STRING
                                }
                            },
                            "src": {
                                type: JsonSchemaType.STRING
                            }
                        },
                        required: [
                            "category",
                            "title",
                            "author",
                            "summary",
                            "date_created",
                            "last_modified",
                            "tags",
                            "src"
                        ]
                    }
                },
                "size": {
                    type: JsonSchemaType.INTEGER
                },
                "offset": {
                    type: JsonSchemaType.STRING
                }
            },
            required: [
                "articles",
                "size",
                "offset"
            ]
        },
        "message": {
            type: JsonSchemaType.STRING
        }
    },
    required: [
        "success",
        "data",
        "message"
    ]
};

export const articlePlainJson = `
    {"success":true,"data":{"articles":[{"category":"career","title":"markdown test","author":"Bob","summary":"This is a
     test file.","date_created":"2020-09-11T08:00:00.001Z","last_modified":"2020-09-11T10:00:00.001Z","tags":["job fair"
     ,"graduates","company"],"src":"2020-09-11-markdown-test/"},{"category":"career","title":"markdown test","author":"B
     ob","summary":"This is a test file.","date_created":"2020-09-11T08:00:00.001Z","last_modified":"2020-09-11T10:00:00
     .001Z","tags":["job fair","graduates","company"],"src":"2020-09-11-markdown-test/"},{"category":"career","title":"m
     arkdown test","author":"Bob","summary":"This is a test file.","date_created":"2020-09-11T08:00:00.001Z","last_modif
     ied":"2020-09-11T10:00:00.001Z","tags":["job fair","graduates","company"],"src":"2020-09-11-markdown-test/"},{"cate
     gory":"career","title":"markdown test","author":"Bob","summary":"This is a test file.","date_created":"2020-09-11T0
     8:00:00.001Z","last_modified":"2020-09-11T10:00:00.001Z","tags":["job fair","graduates","company"],"src":"2020-09-1
     1-markdown-test/"},{"category":"career","title":"markdown test","author":"Bob","summary":"This is a test file.","da
     te_created":"2020-09-11T08:00:00.001Z","last_modified":"2020-09-11T10:00:00.001Z","tags":["job fair","graduates","c
     ompany"],"src":"2020-09-11-markdown-test/"}],"size":5,"offset":"dfne2341tt4ebewauka34ihy23784y128"},"message":"OK"}
     `
export const careerInfoSchema: JsonSchema = {};