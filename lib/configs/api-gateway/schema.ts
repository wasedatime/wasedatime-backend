import * as apigw from 'aws-cdk-lib/aws-apigateway';

export const syllabusSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.ARRAY,
  title: 'Syllabus',
  description: 'The new syllabus JSON schema for each school.',
  items: {
    type: apigw.JsonSchemaType.OBJECT,
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
        type: apigw.JsonSchemaType.STRING,
        title: 'Course Key',
        description: 'Course key of the course.',
      },
      b: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Title',
        description: 'Course title in English.',
      },
      c: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Title JP',
        description: 'Course title in Japanese.',
      },
      d: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Instructor',
        description: "Instructor's name in English.",
      },
      e: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Instructor JP',
        description: "Instructor's name in Japanese.",
      },
      f: {
        type: apigw.JsonSchemaType.ARRAY,
        title: 'Langauges',
        description: 'Languages in which the course is taught.',
        items: {
          type: apigw.JsonSchemaType.INTEGER,
          title: 'Language',
          description:
            '-1 N/A | 0 Japanese | 1 English | 2 German | 3 French | 4 Chinese | 5 Spanish | 6 Korean | 7 Russia | 8 Italian | 9 other',
          enum: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        },
      },
      g: {
        type: apigw.JsonSchemaType.INTEGER,
        title: 'Type',
        description:
          'Type of the course\n-1 N/A | 0 Lecture | 1 Seminar | 2 Work | 3 Foreign Langauge | 4 On-demand | 5 Thesis | 6 Graduate Research | 7 Practice | 8 Blended',
        enum: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8],
      },
      h: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Term',
        description:
          "The term in which the course is taught.\nseason := 0 Spring | 1 Summer | 2 Fall | 3 Winter\nperiod := 's' Semester| 'q' Quarter | 'i' Intensive Course | 'f' Full Year | 't' Term\ndelimiter := '/' or | '&' and",
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
        type: apigw.JsonSchemaType.ARRAY,
        title: 'Occurrences',
        description: 'The schedules and locations of the course.',
        items: {
          type: apigw.JsonSchemaType.OBJECT,
          title: 'Occurrence',
          description: 'Schedule and location',
          required: ['d', 'p', 'l'],
          properties: {
            d: {
              type: apigw.JsonSchemaType.INTEGER,
              title: 'Day',
              description:
                'The day on which the course is taught.\n-1 others | 0 Mon | 1 Tues | 2 Wed | 3 Thur | 4 Fri | 5 Sat | 6 Sun',
              enum: [-1, 0, 1, 2, 3, 4, 5, 6],
            },
            p: {
              type: apigw.JsonSchemaType.INTEGER,
              title: 'Period',
              description:
                'The period on which the course is taught.\nstart_period := -1 others | 0 On-demand | 1 .. 9\nend_period := start_period ',
            },
            l: {
              type: apigw.JsonSchemaType.STRING,
              title: 'Loction',
              description: 'The location where the course takes place.',
            },
          },
        },
      },
      j: {
        type: apigw.JsonSchemaType.INTEGER,
        title: 'Minimum Eligible Year',
        description: 'Minimum eligible year.\n-1 unknown | 1 .. 4',
        enum: [-1, 1, 2, 3, 4],
      },
      k: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Category',
        description: 'The category the course falls in.',
      },
      l: {
        type: apigw.JsonSchemaType.INTEGER,
        title: 'Credit',
        description: 'The credit of the course.\n -1 unknown | 0 ..',
      },
      m: {
        type: apigw.JsonSchemaType.INTEGER,
        title: 'Level',
        description:
          'The level/difficulty of the course.\n-1 N/A | 0 Beginner | 1 Intermediate | 2 Advanced | 3 Final-stage | 4 Master | 5 Doctor',
        enum: [-1, 0, 1, 2, 3, 4, 5],
      },
      n: {
        type: apigw.JsonSchemaType.ARRAY,
        title: 'Evaluations',
        description:
          'The distribution of evaluation criterion and their descriptions',
        items: {
          type: apigw.JsonSchemaType.OBJECT,
          title: 'Evaluation',
          description: 'Criteria and description',
          required: ['t', 'p', 'c'],
          properties: {
            t: {
              type: apigw.JsonSchemaType.INTEGER,
              title: 'Type',
              description:
                'Type of the evaluation\n-1 Unknown | 0 Exam | 1 Papers | 2 Class Participation | 3 Others',
              enum: [-1, 0, 1, 2, 3],
            },
            p: {
              type: apigw.JsonSchemaType.INTEGER,
              title: 'Percentage',
              description: 'The percentage of this criteria in evaluation.',
            },
            c: {
              type: apigw.JsonSchemaType.STRING,
              title: 'Comment',
              description: 'An explanation about the criteria.',
            },
          },
        },
      },
      o: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Code',
        description: 'Course code',
      },
      p: {
        type: apigw.JsonSchemaType.STRING,
        title: 'Subtitle',
        description: 'Subtitle of the course (often seen in seminar courses)',
      },
      q: {
        type: apigw.JsonSchemaType.STRING,
        title: 'CategoryJP',
        description: 'The category the course falls in.(in Japanese)',
      },
    },
  },
};

export const courseReviewGetRespSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigw.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigw.JsonSchemaType.ARRAY,
      items: {
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          title_jp: {
            type: apigw.JsonSchemaType.STRING,
          },
          instructor_jp: {
            type: apigw.JsonSchemaType.STRING,
          },
          updated_at: {
            type: apigw.JsonSchemaType.STRING,
          },
          created_at: {
            type: apigw.JsonSchemaType.STRING,
          },
          benefit: {
            type: apigw.JsonSchemaType.INTEGER,
          },
          difficulty: {
            type: apigw.JsonSchemaType.INTEGER,
          },
          satisfaction: {
            type: apigw.JsonSchemaType.INTEGER,
          },
          instructor: {
            type: apigw.JsonSchemaType.STRING,
          },
          comment_zh_CN: {
            type: apigw.JsonSchemaType.STRING,
          },
          comment_en: {
            type: apigw.JsonSchemaType.STRING,
          },
          comment_ko: {
            type: apigw.JsonSchemaType.STRING,
          },
          year: {
            type: apigw.JsonSchemaType.INTEGER,
          },
          src_lang: {
            type: apigw.JsonSchemaType.STRING,
          },
          comment_ja: {
            type: apigw.JsonSchemaType.STRING,
          },
          comment_zh_TW: {
            type: apigw.JsonSchemaType.STRING,
          },
          title: {
            type: apigw.JsonSchemaType.STRING,
          },
          mod: {
            type: apigw.JsonSchemaType.BOOLEAN,
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
      type: apigw.JsonSchemaType.STRING,
    },
  },
  required: ['success', 'data', 'message'],
};

export const courseReviewPostReqSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigw.JsonSchemaType.OBJECT,
      properties: {
        title_jp: {
          type: apigw.JsonSchemaType.STRING,
        },
        instructor_jp: {
          type: apigw.JsonSchemaType.STRING,
        },
        benefit: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        difficulty: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        satisfaction: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        instructor: {
          type: apigw.JsonSchemaType.STRING,
        },
        year: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        comment: {
          type: apigw.JsonSchemaType.STRING,
        },
        title: {
          type: apigw.JsonSchemaType.STRING,
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
  required: ['data'],
};

export const courseReviewPatchReqSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigw.JsonSchemaType.OBJECT,
      properties: {
        benefit: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        difficulty: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        satisfaction: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        comment: {
          type: apigw.JsonSchemaType.STRING,
        },
      },
      required: ['benefit', 'difficulty', 'satisfaction', 'comment'],
    },
  },
  required: ['data'],
};

export const forumThreadGetRespSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigw.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigw.JsonSchemaType.ARRAY,
      items: {
        type: apigw.JsonSchemaType.OBJECT,
        properties: {
          univ_id: {
            type: apigw.JsonSchemaType.INTEGER,
          },
          board_id: {
            type: apigw.JsonSchemaType.STRING,
          },
          updated_at: {
            type: apigw.JsonSchemaType.STRING,
          },
          created_at: {
            type: apigw.JsonSchemaType.STRING,
          },
          tag_id: {
            type: apigw.JsonSchemaType.STRING,
          },
          group_id: {
            type: apigw.JsonSchemaType.STRING,
          },
          thread_id: {
            type: apigw.JsonSchemaType.STRING,
          },
          title: {
            type: apigw.JsonSchemaType.STRING,
          },
          body: {
            type: apigw.JsonSchemaType.STRING,
          },
          mod: {
            type: apigw.JsonSchemaType.BOOLEAN,
          },
        },
        required: [
          'univ_id',
          'board_id',
          'updated_at',
          'created_at',
          'tag_id',
          'group_id',
          'thread_id',
          'title',
          'body',
          'mod',
        ],
      },
    },
    message: {
      type: apigw.JsonSchemaType.STRING,
    },
  },
  required: ['success', 'data', 'message'],
};

export const forumThreadPostReqSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigw.JsonSchemaType.OBJECT,
      properties: {
        univ_id: {
          type: apigw.JsonSchemaType.INTEGER,
        },
        board_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        tag_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        group_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        thread_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        title: {
          type: apigw.JsonSchemaType.STRING,
        },
        body: {
          type: apigw.JsonSchemaType.STRING,
        },
      },
      required: [
        'univ_id',
        'board_id',
        'tag_id',
        'group_id',
        'thread_id',
        'title',
        'body',
      ],
    },
  },
  required: ['data'],
};

export const forumThreadPatchReqSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    data: {
      type: apigw.JsonSchemaType.OBJECT,
      properties: {
        board_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        tag_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        thread_id: {
          type: apigw.JsonSchemaType.STRING,
        },
        title: {
          type: apigw.JsonSchemaType.STRING,
        },
        body: {
          type: apigw.JsonSchemaType.STRING,
        },
      },
      required: ['board_id', 'tag_id', 'thread_id', 'title', 'body'],
    },
  },
  required: ['data'],
};

export const baseJsonApiSchema: apigw.JsonSchema = {
  schema: apigw.JsonSchemaVersion.DRAFT7,
  type: apigw.JsonSchemaType.OBJECT,
  properties: {
    success: {
      type: apigw.JsonSchemaType.BOOLEAN,
    },
    data: {
      type: apigw.JsonSchemaType.NULL,
    },
    message: {
      type: apigw.JsonSchemaType.STRING,
    },
  },
  required: ['success', 'data', 'message'],
};

export const careerInfoSchema: apigw.JsonSchema = {};
