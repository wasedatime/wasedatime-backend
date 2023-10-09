import * as lambda_py from '@aws-cdk/aws-lambda-python-alpha';
import { Duration } from 'aws-cdk-lib';
import { ApiGateway } from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambda_js from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { AwsServicePrincipal } from '../../configs/common/aws';
import {
  GOOGLE_API_SERVICE_ACCOUNT_INFO,
  SLACK_WEBHOOK_URL,
} from '../../configs/lambda/environment';

interface FunctionsProps {
  envVars: { [name: string]: string };
}

export class CourseReviewsFunctions extends Construct {
  readonly getFunction: lambda.Function;
  readonly postFunction: lambda.Function;
  readonly patchFunction: lambda.Function;
  readonly deleteFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const dynamoDBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-read',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
        ],
      },
    );

    const dynamoDBPutRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-put-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-write',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
        ],
      },
    );

    this.getFunction = new lambda_py.PythonFunction(this, 'get-reviews', {
      entry: 'src/lambda/get-reviews',
      description: 'Get course reviews from the database.',
      functionName: 'get-course-reviews',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBReadRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.postFunction = new lambda_py.PythonFunction(this, 'post-review', {
      entry: 'src/lambda/post-review',
      description: 'Save course reviews into the database.',
      functionName: 'post-course-review',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.patchFunction = new lambda_py.PythonFunction(this, 'patch-review', {
      entry: 'src/lambda/patch-review',
      description: 'Update course reviews in the database.',
      functionName: 'patch-course-review',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.deleteFunction = new lambda_py.PythonFunction(this, 'delete-review', {
      entry: 'src/lambda/delete-review',
      description: 'Delete course reviews in the database.',
      functionName: 'delete-course-review',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });
  }
}

export class SyllabusScraper extends Construct {
  readonly baseFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const s3AccessRole: iam.LazyRole = new iam.LazyRole(
      this,
      's3-access-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description: 'Allow lambda function to access s3 buckets',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 's3-lambda-full-access',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-full-access',
            'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          ),
        ],
      },
    );

    this.baseFunction = new lambda_py.PythonFunction(this, 'base-function', {
      entry: 'src/lambda/syllabus-scraper',
      description:
        'Base function for scraping syllabus data from Waseda University.',
      functionName: 'syllabus-scraper',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 4096,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(300),
      environment: props.envVars,
      role: s3AccessRole,
    });
  }
}

export class AmplifyStatusPublisher extends Construct {
  readonly baseFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: FunctionsProps) {
    super(scope, id);

    this.baseFunction = new lambda_js.NodejsFunction(this, 'base-function', {
      entry: 'src/lambda/amplify-status-publisher/index.js',
      description:
        'Forwards Amplify build status message from SNS to Slack Webhook.',
      functionName: 'amplify-status-publisher',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(3),
    }).addEnvironment('SLACK_WEBHOOK_URL', SLACK_WEBHOOK_URL);
  }
}

export class ScraperStatusPublisher extends Construct {
  readonly baseFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: FunctionsProps) {
    super(scope, id);

    this.baseFunction = new lambda_js.NodejsFunction(this, 'base-function', {
      entry: 'src/lambda/sfn-status-publisher/index.js',
      description:
        'Forwards scraper execution status message from SNS to Slack Webhook.',
      functionName: 'scraper-status-publisher',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(3),
    }).addEnvironment('SLACK_WEBHOOK_URL', SLACK_WEBHOOK_URL);
  }
}

export class PreSignupWasedaMailValidator extends Construct {
  readonly baseFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: FunctionsProps) {
    super(scope, id);

    this.baseFunction = new lambda_py.PythonFunction(this, 'base-function', {
      entry: 'src/lambda/signup-validator',
      description: 'Validates if the user is signing up using WasedaMail',
      functionName: 'wasedamail-signup-validator',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
    });
  }
}

export class TimetableFunctions extends Construct {
  readonly getFunction: lambda.Function;
  readonly postFunction: lambda.Function;
  readonly patchFunction: lambda.Function;
  readonly deleteFunction: lambda.Function;
  readonly putFunction: lambda.Function;
  // readonly importFunction: lambda.Function;
  // readonly exportFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const dynamoDBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-read-timetable',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
        ],
      },
    );

    const dynamoDBPutRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-put-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-write-timetable',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
        ],
      },
    );

    this.getFunction = new lambda_py.PythonFunction(this, 'get-timetable', {
      entry: 'src/lambda/get-timetable',
      description: 'Get timetable from the database.',
      functionName: 'get-timetable',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBReadRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.postFunction = new lambda_py.PythonFunction(this, 'post-timetable', {
      entry: 'src/lambda/post-timetable',
      description: 'Save timetable into the database.',
      functionName: 'post-timetable',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.patchFunction = new lambda_py.PythonFunction(this, 'patch-timetable', {
      entry: 'src/lambda/patch-timetable',
      description: 'Update timetable in the database.',
      functionName: 'patch-timetable',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.putFunction = new lambda_py.PythonFunction(this, 'put-timetable', {
      entry: 'src/lambda/put-timetable',
      description: 'Put timetable in the database.',
      functionName: 'put-timetable',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    //     this.importFunction = new lambda_py.PythonFunction(this, 'import-timetable', {
    //         entry: 'src/lambda/import-timetable',
    //         description: "Import timetable from pdf.",
    //         functionName: "import-timetable",
    //         logRetention: logs.RetentionDays.ONE_MONTH,
    //         memorySize: 256,
    //         runtime: lambda.Runtime.PYTHON_3_9,
    //         timeout: Duration.seconds(5),
    //     });
    //
    //     this.exportFunction = new lambda_py.PythonFunction(this, 'export-timetable', {
    //         entry: 'src/lambda/export-timetable',
    //         description: "Export timetable as image.",
    //         functionName: "export-timetable",
    //         logRetention: logs.RetentionDays.ONE_MONTH,
    //         memorySize: 512,
    //         runtime: lambda.Runtime.PYTHON_3_9,
    //         timeout: Duration.seconds(5),
    //     });
  }
}

export class SyllabusFunctions extends Construct {
  readonly getFunction: lambda.Function;
  readonly postFunction: lambda.Function;

  constructor(scope: Construct, id: string, props?: FunctionsProps) {
    super(scope, id);

    const dynamoDBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-read-syllabus',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
        ],
      },
    );

    this.getFunction = new lambda_py.PythonFunction(this, 'get-course', {
      entry: 'src/lambda/get-course',
      description: 'Get course info from Waseda.',
      functionName: 'get-course',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
    });

    const comprehendFullAccessRole: iam.LazyRole = new iam.LazyRole(
      this,
      'comprehend-access-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description: 'Allow lambda function to interact with AWS Comprehend',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'lambda-comprehend-access',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'comprehend-full-access',
            'arn:aws:iam::aws:policy/ComprehendFullAccess',
          ),
        ],
      },
    );

    this.postFunction = new lambda_py.PythonFunction(this, 'post-book', {
      entry: 'src/lambda/get-book-info',
      description: 'Analyze reference and output book info.',
      functionName: 'get-book-info',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      runtime: lambda.Runtime.PYTHON_3_9,
      role: comprehendFullAccessRole,
      timeout: Duration.seconds(10),
    });
  }
}

export class SyllabusUpdateFunction extends Construct {
  readonly updateFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const LambdaFullAccess = new iam.LazyRole(this, 'lambda-fullaccess-role', {
      assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
      description: 'Allow lambda function to access s3 buckets and dynamodb',
      path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
      roleName: 'lambda-full-access',
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'basic-exec',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          'db-full-access',
          'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
        ),
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          's3-read-only',
          'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
        ),
      ],
    });

    this.updateFunction = new lambda_py.PythonFunction(
      this,
      'update-syllabus',
      {
        entry: 'src/lambda/update-syllabus',
        description: 'Update syllabus when S3 bucket is updated.',
        functionName: 'update-syllabus',
        role: LambdaFullAccess,
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(60),
        environment: props.envVars,
      },
    );
  }
}

export class ForumThreadFunctions extends Construct {
  readonly getAllFunction: lambda.Function;
  readonly getUserFunction: lambda.Function;
  readonly getSingleFunction: lambda.Function;
  readonly postFunction: lambda.Function;
  readonly patchFunction: lambda.Function;
  readonly deleteFunction: lambda.Function;
  readonly testPostFunction: lambda.Function;
  readonly testGetFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const DBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform read operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-lambda-read-thread',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-read-only',
            'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
          ),
        ],
      },
    );

    const DBPutRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-put-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-put-role',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-full-access',
            'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          ),
        ],
      },
    );

    this.getAllFunction = new lambda_py.PythonFunction(
      this,
      'get-all-threads',
      {
        entry: 'src/lambda/get-all-threads',
        description: 'Get all forum threads from the database.',
        functionName: 'get-all-threads',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        role: DBReadRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(10),
        environment: props.envVars,
      },
    );

    this.getUserFunction = new lambda_py.PythonFunction(
      this,
      'get-user-threads',
      {
        entry: 'src/lambda/get-user-threads',
        description: "Get user's threads from the database.",
        functionName: 'get-user-threads',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        role: DBReadRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(3),
        environment: props.envVars,
      },
    );

    this.getSingleFunction = new lambda_py.PythonFunction(
      this,
      'get-single-thread',
      {
        entry: 'src/lambda/get-single-thread',
        description: 'Gets a single forum thread from the database.',
        functionName: 'get-single-thread',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        role: DBPutRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(3),
        environment: props.envVars,
      },
    );

    this.postFunction = new lambda_py.PythonFunction(this, 'post-thread', {
      entry: 'src/lambda/post-thread',
      description: 'Save forum thread into the database.',
      functionName: 'post-forum-thread',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: DBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.patchFunction = new lambda_py.PythonFunction(this, 'patch-thread', {
      entry: 'src/lambda/patch-thread',
      description: 'Update forum thread in the database.',
      functionName: 'patch-forum-thread',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: DBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.deleteFunction = new lambda_py.PythonFunction(this, 'delete-thread', {
      entry: 'src/lambda/delete-thread',
      description: 'Delete forum thread in the database.',
      functionName: 'delete-forum-thread',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: DBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.testPostFunction = new lambda_py.PythonFunction(
      this,
      'test-post-thread',
      {
        entry: 'src/lambda/test-post-thread',
        description: 'lambda to test forum functionalities',
        functionName: 'test-post-forum-thread',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        role: DBPutRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(3),
        environment: props.envVars,
      },
    );

    this.testGetFunction = new lambda_py.PythonFunction(
      this,
      'test-get-thread',
      {
        entry: 'src/lambda/test-get-single-thread',
        description: 'lambda to test forum get functionalities',
        functionName: 'test-get-forum-thread',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 128,
        role: DBPutRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(3),
        environment: props.envVars,
      },
    );
  }
}

export class ForumCommentFunctions extends Construct {
  readonly getFunction: lambda.Function;
  readonly postFunction: lambda.Function;
  readonly patchFunction: lambda.Function;
  readonly deleteFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const dynamoDBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-read-comment',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
        ],
      },
    );

    const dynamoDBPutRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-put-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-lambda-write-comment',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
        ],
      },
    );

    this.getFunction = new lambda_py.PythonFunction(this, 'get-comment', {
      entry: 'src/lambda/get-comments',
      description: 'get forum comments from the database.',
      functionName: 'get-forum-comments',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBReadRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    this.postFunction = new lambda_py.PythonFunction(this, 'post-comment', {
      entry: 'src/lambda/post-comment',
      description: 'Save forum comment into the database.',
      functionName: 'post-forum-comment',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.patchFunction = new lambda_py.PythonFunction(this, 'patch-comment', {
      entry: 'src/lambda/patch-comment',
      description: 'Update forum comment in the database.',
      functionName: 'patch-forum-comment',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    }).addEnvironment(
      'GOOGLE_API_SERVICE_ACCOUNT_INFO',
      GOOGLE_API_SERVICE_ACCOUNT_INFO,
    );

    this.deleteFunction = new lambda_py.PythonFunction(this, 'delete-comment', {
      entry: 'src/lambda/delete-comment',
      description: 'Delete forum comment in the database.',
      functionName: 'delete-forum-comment',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: dynamoDBPutRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });
  }
}

export class ThreadImageProcessFunctions extends Construct {
  // readonly getFunction: lambda.Function;
  readonly syncImageFunction: lambda.Function;
  readonly resizeImageFunction: lambda.Function;
  // readonly deleteFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const DBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform read operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-lambda-read-thread',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-read-only',
            'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
          ),
        ],
      },
    );

    const DBSyncRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-thread-sync-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-thread-sync-role',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-full-access',
            'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          ),
        ],
      },
    );

    this.syncImageFunction = new lambda_py.PythonFunction(this, 'sync-image', {
      entry: 'src/lambda/sync-image',
      description:
        'post image to dyanamo db database when image inputed in s3 bucket',
      functionName: 'sync-image',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: DBSyncRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    });

    this.resizeImageFunction = new lambda_py.PythonFunction(
      this,
      'resize-image',
      {
        entry: 'src/lambda/resize-image',
        description:
          'Resize uploaded image to a thumbnail and store in s3 bucket',
        functionName: 'patch-image',
        logRetention: logs.RetentionDays.ONE_MONTH,
        memorySize: 256,
        role: DBSyncRole,
        runtime: lambda.Runtime.PYTHON_3_9,
        timeout: Duration.seconds(5),
        environment: props.envVars,
      },
    );

    // this.getFunction = new lambda_py.PythonFunction(this, "get-comment", {
    //   entry: "src/lambda/get-comments",
    //   description: "get forum comments from the database.",
    //   functionName: "get-forum-comments",
    //   logRetention: logs.RetentionDays.ONE_MONTH,
    //   memorySize: 128,
    //   role: DBReadRole,
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   timeout: Duration.seconds(3),
    //   environment: props.envVars,
    // });

    // this.deleteFunction = new lambda_py.PythonFunction(this, "delete-comment", {
    //   entry: "src/lambda/delete-comment",
    //   description: "Delete forum comment in the database.",
    //   functionName: "delete-forum-comment",
    //   logRetention: logs.RetentionDays.ONE_MONTH,
    //   memorySize: 128,
    //   role: DBPutRole,
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   timeout: Duration.seconds(3),
    //   environment: props.envVars,
    // });
  }
}

export class AdsImageProcessFunctions extends Construct {
  readonly getFunction: lambda.Function;
  readonly syncImageFunction: lambda.Function;
  readonly resizeImageFunction: lambda.Function;
  // readonly deleteFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: FunctionsProps) {
    super(scope, id);

    const DBReadRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-read-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform read operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-lambda-read-thread',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-read-only',
            'arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-read-only',
            'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
          ),
        ],
      },
    );

    const DBSyncRole: iam.LazyRole = new iam.LazyRole(
      this,
      'dynamo-s3-ads-sync-role',
      {
        assumedBy: new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA),
        description:
          'Allow lambda function to perform crud operation on dynamodb and s3',
        path: `/service-role/${AwsServicePrincipal.LAMBDA}/`,
        roleName: 'dynamodb-s3-ads-sync-role',
        managedPolicies: [
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'basic-exec1',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            'db-full-access',
            'arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess',
          ),
          iam.ManagedPolicy.fromManagedPolicyArn(
            this,
            's3-full-access',
            'arn:aws:iam::aws:policy/AmazonS3FullAccess',
          ),
        ],
      },
    );

    this.syncImageFunction = new lambda_py.PythonFunction(this, 'sync-image', {
      entry: 'src/lambda/sync-image',
      description:
        'post image to dyanamo db database when image inputed in s3 bucket',
      functionName: 'sync-image',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 256,
      role: DBSyncRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(5),
      environment: props.envVars,
    });

    this.getFunction = new lambda_py.PythonFunction(this, 'get-imgs-list', {
      entry: 'src/lambda/get-imgs-list',
      description: 'get imgs list from the database.',
      functionName: 'get-imgs-list',
      logRetention: logs.RetentionDays.ONE_MONTH,
      memorySize: 128,
      role: DBReadRole,
      runtime: lambda.Runtime.PYTHON_3_9,
      timeout: Duration.seconds(3),
      environment: props.envVars,
    });

    // this.resizeImageFunction = new lambda_py.PythonFunction(
    //   this,
    //   "resize-image",
    //   {
    //     entry: "src/lambda/resize-image",
    //     description:
    //       "Resize uploaded image to a thumbnail and store in s3 bucket",
    //     functionName: "patch-image",
    //     logRetention: logs.RetentionDays.ONE_MONTH,
    //     memorySize: 256,
    //     role: DBSyncRole,
    //     runtime: lambda.Runtime.PYTHON_3_9,
    //     timeout: Duration.seconds(5),
    //     environment: props.envVars,
    //   }
    // );

    // this.deleteFunction = new lambda_py.PythonFunction(this, "delete-comment", {
    //   entry: "src/lambda/delete-comment",
    //   description: "Delete forum comment in the database.",
    //   functionName: "delete-forum-comment",
    //   logRetention: logs.RetentionDays.ONE_MONTH,
    //   memorySize: 128,
    //   role: DBPutRole,
    //   runtime: lambda.Runtime.PYTHON_3_9,
    //   timeout: Duration.seconds(3),
    //   environment: props.envVars,
    // });
  }
}
