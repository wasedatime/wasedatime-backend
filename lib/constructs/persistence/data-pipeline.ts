import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as event_sources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as sfn_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { syllabusSchedule } from '../../configs/event/schedule';
import { prodCorsRule } from '../../configs/s3/cors';
import { allowApiGatewayPolicy, allowLambdaPolicy } from '../../utils/s3';
import {
  SyllabusScraper,
  SyllabusUpdateFunction,
  ImageProcessFunctions,
} from '../common/lambda-functions';

export enum Worker {
  SYLLABUS,
  CAREER,
  FEEDS,
  THREADIMG,
  ADS, //! New ADS value
}

export interface DataPipelineProps {
  dataSource?: s3.Bucket;
  dataWarehouse?: dynamodb.Table;
}

export abstract class AbstractDataPipeline extends Construct {
  abstract readonly dataSource?: s3.Bucket;
  abstract readonly processor: lambda.Function | sfn.StateMachine;
  abstract readonly dataWarehouse: s3.Bucket | dynamodb.Table;
}

export class SyllabusDataPipeline extends AbstractDataPipeline {
  readonly dataSource?: s3.Bucket;
  readonly processor: sfn.StateMachine;
  readonly dataWarehouse: s3.Bucket;
  readonly schedules: { [name: string]: events.Rule } = {};

  constructor(scope: Construct, id: string, props?: DataPipelineProps) {
    super(scope, id);

    this.dataWarehouse = new s3.Bucket(this, 'syllabus-bucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: 'wasedatime-syllabus-prod',
      cors: prodCorsRule,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: true,
    });
    allowApiGatewayPolicy(this.dataWarehouse);
    allowLambdaPolicy(this.dataWarehouse);

    const scraperBaseFunction: lambda.Function = new SyllabusScraper(
      this,
      'scraper-base-function',
      {
        envVars: {
          ['BUCKET_NAME']: this.dataWarehouse.bucketName,
          ['OBJECT_PATH']: 'syllabus/',
        },
      },
    ).baseFunction;

    function getLambdaTaskInstance(
      schools: string[],
      num: string,
    ): sfn_tasks.LambdaInvoke {
      return new sfn_tasks.LambdaInvoke(scope, 'task-' + num, {
        lambdaFunction: scraperBaseFunction,
        comment: 'Scrape the syllabus info of school(s).',
        invocationType: sfn_tasks.LambdaInvocationType.REQUEST_RESPONSE,
        payload: sfn.TaskInput.fromObject({ schools: schools }),
        qualifier: scraperBaseFunction.latestVersion.version,
      });
    }

    // todo sync to table
    this.processor = new sfn.StateMachine(this, 'state-machine', {
      stateMachineName: 'syllabus-scraper',
      definition: getLambdaTaskInstance(['GEC'], '0')
        .next(getLambdaTaskInstance(['CMS', 'HSS'], '1'))
        .next(getLambdaTaskInstance(['EDU', 'FSE'], '2'))
        .next(getLambdaTaskInstance(['ASE', 'CSE'], '3'))
        .next(getLambdaTaskInstance(['PSE', 'G_ASE', 'LAW'], '4'))
        .next(getLambdaTaskInstance(['G_FSE', 'SOC', 'SSS'], '5'))
        .next(getLambdaTaskInstance(['G_LAS', 'G_CSE', 'G_EDU', 'HUM'], '6'))
        .next(
          getLambdaTaskInstance(
            ['SILS', 'G_HUM', 'CJL', 'SPS', 'G_WBS', 'G_PS'],
            '7',
          ),
        )
        .next(
          getLambdaTaskInstance(
            [
              'G_SPS',
              'G_IPS',
              'G_WLS',
              'G_E',
              'G_SSS',
              'G_SC',
              'G_LAW',
              'G_SAPS',
              'G_SA',
              'G_SJAL',
              'G_SICCS',
              'G_SEEE',
              'EHUM',
              'ART',
              'CIE',
              'G_ITS',
            ],
            '8',
          ),
        )
        .next(new sfn.Succeed(this, 'success', {})),
    });

    for (const name in syllabusSchedule) {
      this.schedules[name] = new events.Rule(this, name, {
        ruleName: name,
        enabled: true,
        schedule: syllabusSchedule[name],
        targets: [new events_targets.SfnStateMachine(this.processor)],
      });
    }
  }
}

//todo add s3 deployment and notifications
export class CareerDataPipeline extends AbstractDataPipeline {
  readonly dataSource?: s3.Bucket;
  readonly processor: lambda.Function;
  readonly dataWarehouse: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: DataPipelineProps) {
    super(scope, id);

    this.dataSource = new s3.Bucket(this, 'career-bucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: 'wasedatime-career',
      cors: prodCorsRule,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
    });
  }
}

// sync syllabus on notification
export class SyllabusSyncPipeline extends AbstractDataPipeline {
  readonly dataSource: s3.Bucket;
  readonly processor: lambda.Function;
  readonly dataWarehouse: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataPipelineProps) {
    super(scope, id);

    this.dataWarehouse = new dynamodb.Table(this, 'dynamodb-syllabus-table', {
      partitionKey: { name: 'school', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      timeToLiveAttribute: 'ttl',
      tableName: 'waseda-syllabus',
      readCapacity: 1,
      writeCapacity: 1,
    });
    //Use exsisting s3 bucket
    this.dataSource = props.dataSource!;

    this.processor = new SyllabusUpdateFunction(
      this,
      'syllabus-update-function',
      {
        envVars: {
          ['BUCKET_NAME']: this.dataSource.bucketName,
          ['TABLE_NAME']: this.dataWarehouse.tableName,
          ['OBJECT_PATH']: 'syllabus/',
        },
      },
    ).updateFunction;

    this.processor.addEventSource(
      new event_sources.S3EventSource(this.dataSource, {
        events: [s3.EventType.OBJECT_CREATED_PUT],
        filters: [{ prefix: 'syllabus/' }],
      }),
    );
  }
}

export class ThreadImgDataPipeline extends AbstractDataPipeline {
  readonly dataSource: s3.Bucket;
  readonly processor: lambda.Function;
  readonly dataWarehouse: s3.Bucket;

  constructor(scope: Construct, id: string, props?: DataPipelineProps) {
    super(scope, id);

    // Initialize S3 bucket for storing thread images
    this.dataSource = new s3.Bucket(this, 'thread-img-bucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: 'wasedatime-thread-img',
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
    });

    this.dataWarehouse = new s3.Bucket(this, 'thumbnail-img-warehouse', {
      bucketName: 'wasedatime-thumbnail-img',
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
    });

    this.processor = new ImageProcessFunctions(this, 'image-process-func', {
      envVars: {
        INPUT_BUCKET: this.dataSource.bucketName,
        OUTPUT_BUCKET: this.dataWarehouse.bucketName,
        TABLE_NAME: 'wasedatime-thread-img',
      },
    }).resizeImageFunction;

    const supportedExtensions = ['jpeg', 'png', 'gif', 'jpg'];

    for (const ext of supportedExtensions) {
      this.processor.addEventSource(
        new event_sources.S3EventSource(this.dataSource, {
          events: [s3.EventType.OBJECT_CREATED_PUT],
          filters: [{ prefix: `/image.${ext}` }],
        }),
      );
    }
  }
}

//! New pipeline for ads
export class AdsDataPipeline extends AbstractDataPipeline {
  readonly dataSource?: s3.Bucket;
  readonly processor: lambda.Function;
  readonly dataWarehouse: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataPipelineProps) {
    super(scope, id);

    this.dataSource = new s3.Bucket(this, 'ads-bucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: 'wasedatime-ads',
      cors: prodCorsRule,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: false,
    });

    this.dataWarehouse = props.dataWarehouse!;

    this.processor = new ImageProcessFunctions(this, 'image-process-func', {
      envVars: {
        ['BUCKET_NAME']: this.dataSource.bucketName,
        ['TABLE_NAME']: this.dataWarehouse.tableName,
        ['OBJECT_PATH']: 'syllabus/',
      },
    }).syncImageFunction;

    this.processor.addEventSource(
      new event_sources.S3EventSource(this.dataSource, {
        events: [s3.EventType.OBJECT_CREATED_PUT],
        filters: [{ prefix: 'syllabus/' }],
      }),
    );
  }
}
