import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export const syllabusSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.ARRAY,
  title: 'Syllabus',
  description: 'The new syllabus JSON schema for each school.',
  items: {
    type: apigateway.JsonSchemaType.OBJECT,
    title: 'Items',
    description: 'The schema of each course in the array.',
    required: [
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
    ],
    properties: {
      a: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Course Key',
        description: 'Course key of the course.',
      },
      b: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Title',
        description: 'Course title in English.',
      },
      c: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Title JP',
        description: 'Course title in Japanese.',
      },
      d: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Instructor',
        description: 'Instructor\'s name in English.',
      },
      e: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Instructor JP',
        description: 'Instructor\'s name in Japanese.',
      },
      f: {
        type: apigateway.JsonSchemaType.ARRAY,
        title: 'Langauges',
        description: 'Languages in which the course is taught.',
        items: {
          type: apigateway.JsonSchemaType.INTEGER,
          title: 'Language',
          description: '-1 N/A | 0 Japanese | 1 English | 2 German | 3 French | 4 Chinese | 5 Spanish | 6 Korean | 7 Russia | 8 Italian | 9 other',
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
            9,
          ],
        },
      },
      g: {
        type: apigateway.JsonSchemaType.INTEGER,
        title: 'Type',
        description: 'Type of the course\n-1 N/A | 0 Lecture | 1 Seminar | 2 Work | 3 Foreign Langauge | 4 On-demand | 5 Thesis | 6 Graduate Research | 7 Practice | 8 Blended',
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
        ],
      },
      h: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Term',
        description: 'The term in which the course is taught.\nseason := 0 Spring | 1 Summer | 2 Fall | 3 Winter\nperiod := \'s\' Semester| \'q\' Quarter | \'i\' Intensive Course | \'f\' Full Year | \'t\' Term\ndelimiter := \'/\' or | \'&\' and',
        enum: [
          '0s',
          '2s',
          '0q',
          '1q',
          '2q',
          '3q',
          'f',
          '0',
          '1',
          '2',
          '3',
          '0i',
          '2i',
          '0t',
          '2t',
          '3t',
          '0t/1t',
          '0s/2s',
          '2t/3t',
          '1&2s',
          '0s&1',
          'f/2s',
          '0i&3i',
        ],
      },
      i: {
        type: apigateway.JsonSchemaType.ARRAY,
        title: 'Occurrences',
        description: 'The schedules and locations of the course.',
        items: {
          type: apigateway.JsonSchemaType.OBJECT,
          title: 'Occurrence',
          description: 'Schedule and location',
          required: [
            'd',
            'p',
            'l',
          ],
          properties: {
            d: {
              type: apigateway.JsonSchemaType.INTEGER,
              title: 'Day',
              description: 'The day on which the course is taught.\n-1 others | 0 Mon | 1 Tues | 2 Wed | 3 Thur | 4 Fri | 5 Sat | 6 Sun',
              enum: [
                -1,
                0,
                1,
                2,
                3,
                4,
                5,
                6,
              ],
            },
            p: {
              type: apigateway.JsonSchemaType.INTEGER,
              title: 'Period',
              description: 'The period on which the course is taught.\nstart_period := -1 others | 0 On-demand | 1 .. 9\nend_period := start_period ',
            },
            l: {
              type: apigateway.JsonSchemaType.STRING,
              title: 'Loction',
              description: 'The location where the course takes place.',
            },
          },
        },
      },
      j: {
        type: apigateway.JsonSchemaType.INTEGER,
        title: 'Minimum Eligible Year',
        description: 'Minimum eligible year.\n-1 unknown | 1 .. 4',
        enum: [
          -1,
          1,
          2,
          3,
          4,
        ],
      },
      k: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Category',
        description: 'The category the course falls in.',
      },
      l: {
        type: apigateway.JsonSchemaType.INTEGER,
        title: 'Credit',
        description: 'The credit of the course.\n -1 unknown | 0 ..',
      },
      m: {
        type: apigateway.JsonSchemaType.INTEGER,
        title: 'Level',
        description: 'The level/difficulty of the course.\n-1 N/A | 0 Beginner | 1 Intermediate | 2 Advanced | 3 Final-stage | 4 Master | 5 Doctor',
        enum: [
          -1,
          0,
          1,
          2,
          3,
          4,
          5,
        ],
      },
      n: {
        type: apigateway.JsonSchemaType.ARRAY,
        title: 'Evaluations',
        description: 'The distribution of evaluation criterion and their descriptions',
        items: {
          type: apigateway.JsonSchemaType.OBJECT,
          title: 'Evaluation',
          description: 'Criteria and description',
          required: [
            't',
            'p',
            'c',
          ],
          properties: {
            t: {
              type: apigateway.JsonSchemaType.INTEGER,
              title: 'Type',
              description: 'Type of the evaluation\n-1 Unknown | 0 Exam | 1 Papers | 2 Class Participation | 3 Others',
              enum: [
                -1,
                0,
                1,
                2,
                3,
              ],
            },
            p: {
              type: apigateway.JsonSchemaType.INTEGER,
              title: 'Percentage',
              description: 'The percentage of this criteria in evaluation.',
            },
            c: {
              type: apigateway.JsonSchemaType.STRING,
              title: 'Comment',
              description: 'An explanation about the criteria.',
            },
          },
        },
      },
      o: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Code',
        description: 'Course code',
      },
      p: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'Subtitle',
        description: 'Subtitle of the course (often seen in seminar courses)',
      },
      q: {
        type: apigateway.JsonSchemaType.STRING,
        title: 'CategoryJP',
        description: 'The category the course falls in.(in Japanese)',
      },
    },
  },
};

export const courseReviewGetRespSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigateway.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigateway.JsonSchemaType.ARRAY,
      items: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          title_jp: {
            type: apigateway.JsonSchemaType.STRING,
          },
          instructor_jp: {
            type: apigateway.JsonSchemaType.STRING,
          },
          updated_at: {
            type: apigateway.JsonSchemaType.STRING,
          },
          created_at: {
            type: apigateway.JsonSchemaType.STRING,
          },
          benefit: {
            type: apigateway.JsonSchemaType.INTEGER,
          },
          difficulty: {
            type: apigateway.JsonSchemaType.INTEGER,
          },
          satisfaction: {
            type: apigateway.JsonSchemaType.INTEGER,
          },
          instructor: {
            type: apigateway.JsonSchemaType.STRING,
          },
          comment_zh_CN: {
            type: apigateway.JsonSchemaType.STRING,
          },
          comment_en: {
            type: apigateway.JsonSchemaType.STRING,
          },
          comment_ko: {
            type: apigateway.JsonSchemaType.STRING,
          },
          year: {
            type: apigateway.JsonSchemaType.INTEGER,
          },
          src_lang: {
            type: apigateway.JsonSchemaType.STRING,
          },
          comment_ja: {
            type: apigateway.JsonSchemaType.STRING,
          },
          comment_zh_TW: {
            type: apigateway.JsonSchemaType.STRING,
          },
          title: {
            type: apigateway.JsonSchemaType.STRING,
          },
          mod: {
            type: apigateway.JsonSchemaType.BOOLEAN,
          },
        },
        required: [
          'title_jp',
          'instructor_jp',
          'updated_at',
          'created_at',
          'benefit',
          'difficulty',
          'satisfaction',
          'instructor',
          'comment_zh-CN',
          'comment_zh-TW',
          'comment_ko',
          'comment_en',
          'year',
          'src_lang',
          'comment_ja',
          'title',
          'mod',
        ],
      },
    },
    message: {
      type: apigateway.JsonSchemaType.STRING,
    },
  },
  required: [
    'success',
    'data',
    'message',
  ],
};

export const courseReviewPostReqSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
        title_jp: {
          type: apigateway.JsonSchemaType.STRING,
        },
        instructor_jp: {
          type: apigateway.JsonSchemaType.STRING,
        },
        benefit: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        difficulty: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        satisfaction: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        instructor: {
          type: apigateway.JsonSchemaType.STRING,
        },
        year: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        comment: {
          type: apigateway.JsonSchemaType.STRING,
        },
        title: {
          type: apigateway.JsonSchemaType.STRING,
        },
      },
      required: [
        'title_jp',
        'instructor_jp',
        'benefit',
        'difficulty',
        'satisfaction',
        'instructor',
        'comment',
        'year',
        'title',
      ],
    },
  },
  required: [
    'data',
  ],
};

export const courseReviewPatchReqSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
        benefit: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        difficulty: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        satisfaction: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
        comment: {
          type: apigateway.JsonSchemaType.STRING,
        },
      },
      required: [
        'benefit',
        'difficulty',
        'satisfaction',
        'comment',
      ],
    },
  },
  required: [
    'data',
  ],
};

export const baseJsonApiSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigateway.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigateway.JsonSchemaType.NULL,
    },
    message: {
      type: apigateway.JsonSchemaType.STRING,
    },
  },
  required: [
    'success',
    'data',
    'message',
  ],
};

export const articleListSchema: apigateway.JsonSchema = {
  schema: apigateway.JsonSchemaVersion.DRAFT7,
  type: apigateway.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigateway.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigateway.JsonSchemaType.OBJECT,
      properties: {
        articles: {
          type: apigateway.JsonSchemaType.ARRAY,
          items: {
            type: apigateway.JsonSchemaType.OBJECT,
            properties: {
              category: {
                type: apigateway.JsonSchemaType.STRING,
              },
              title: {
                type: apigateway.JsonSchemaType.STRING,
              },
              author: {
                type: apigateway.JsonSchemaType.STRING,
              },
              summary: {
                type: apigateway.JsonSchemaType.STRING,
              },
              created_at: {
                type: apigateway.JsonSchemaType.STRING,
              },
              updated_at: {
                type: apigateway.JsonSchemaType.STRING,
              },
              src: {
                type: apigateway.JsonSchemaType.STRING,
              },
            },
            required: [
              'category',
              'title',
              'author',
              'summary',
              'created_at',
              'updated_at',
              'src',
            ],
          },
        },
        size: {
          type: apigateway.JsonSchemaType.INTEGER,
        },
      },
      required: [
        'articles',
        'size',
      ],
    },
    message: {
      type: apigateway.JsonSchemaType.STRING,
    },
  },
  required: [
    'success',
    'data',
    'message',
  ],
};

export const articlePlainJson = '{"success": true, "data": {"articles": [{"src": "https://wasedatime-blog.s3-ap-northeast-1.amazonaws.com/blogs/tests.md", "created_at": "2021-03-27 18:00:00 +0900", "update_at": "2021-04-13-05-58-09", "type": 0.0, "title": "Studying at Waseda University as a Social Science Student", "author": "Siyuan (Peter) Chai"}, {"src": "https://wasedatime-blog.s3-ap-northeast-1.amazonaws.com/blogs/tests.md", "created_at": "2021-03-27 18:00:00 +0900", "update_at": "2021-04-13-05-58-38", "type": 0.0, "title": "Studying at Waseda University as a Social Science Student", "author": "Siyuan (Peter) Chai"}, {"src": "https://wasedatime-blog.s3-ap-northeast-1.amazonaws.com/blogs/tests.md", "created_at": "2021-03-27 18:00:00 +0900", "update_at": "2021-04-13-05-58-39", "type": 0.0, "title": "Studying at Waseda University as a Social Science Student", "author": "Siyuan (Peter) Chai"}, {"src": "https://wasedatime-blog.s3-ap-northeast-1.amazonaws.com/blogs/tests.md", "created_at": "2021-03-27 18:00:00 +0900", "update_at": "2021-04-13-05-58-40", "type": 0.0, "title": "Studying at Waseda University as a Social Science Student", "author": "Siyuan (Peter) Chai"}, {"src": "https://wasedatime-blog.s3-ap-northeast-1.amazonaws.com/blogs/tests.md", "created_at": "2021-03-27 18:00:00 +0900", "update_at": "2021-04-13-06-34-41", "type": 0.0, "title": "Studying at Waseda University as a Social Science Student", "author": "Siyuan (Peter) Chai"}], "size": 5}, "message": ""}';

export const careerInfoSchema: apigateway.JsonSchema = {};
