import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PersistenceLayer } from '../architecture/layers';
import { DataEndpoint, OperationEndpoint } from '../configs/common/registry';
import {
  AbstractDataPipeline,
  CareerDataPipeline,
  SyllabusDataPipeline,
  SyllabusSyncPipeline,
  ThreadImgDataPipeline,
  Worker,
} from '../constructs/persistence/data-pipeline';
import { Collection, DynamoDatabase } from '../constructs/persistence/database';

export class WasedaTimePersistenceLayer extends PersistenceLayer {
  readonly dataPipelines: { [name in Worker]?: AbstractDataPipeline } = {};
  readonly databases: { [name: string]: DynamoDatabase } = {};

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const syllabusDataPipeline = new SyllabusDataPipeline(
      this,
      'syllabus-datapipeline',
      {},
    );
    this.dataPipelines[Worker.SYLLABUS] = syllabusDataPipeline;

    const syllabusSyncPipeline = new SyllabusSyncPipeline(
      this,
      'syllabus-sync',
      {
        dataSource: syllabusDataPipeline.dataWarehouse,
      },
    );

    const threadImgDataPipeline = new ThreadImgDataPipeline(
      this,
      'thread-img-data-pipeline',
    );
    this.dataPipelines[Worker.THREAD_IMG] = threadImgDataPipeline;

    const dynamoDatabase = new DynamoDatabase(this, 'dynamo-db');
    this.databases['dynamo-main'] = dynamoDatabase;

    this.dataPipelines[Worker.CAREER] = new CareerDataPipeline(
      this,
      'career-datapipeline',
      {
        dataWarehouse: dynamoDatabase.tables[Collection.CAREER],
      },
    );

    this.dataInterface.setEndpoint(
      DataEndpoint.COURSE_REVIEWS,
      dynamoDatabase.tables[Collection.COURSE_REVIEW].tableName,
    );
    this.dataInterface.setEndpoint(
      DataEndpoint.CAREER,
      dynamoDatabase.tables[Collection.CAREER].tableName,
    );
    this.dataInterface.setEndpoint(
      DataEndpoint.TIMETABLE,
      dynamoDatabase.tables[Collection.TIMETABLE].tableName,
    );
    this.dataInterface.setEndpoint(
      DataEndpoint.SYLLABUS,
      syllabusDataPipeline.dataWarehouse.bucketName,
    );
    this.dataInterface.setEndpoint(DataEndpoint.THREAD, {
      dynamoTableName: dynamoDatabase.tables[Collection.THREAD].tableName,
      s3BucketName: threadImgDataPipeline.dataSource.bucketName,
    });
    this.dataInterface.setEndpoint(
      DataEndpoint.COMMENT,
      dynamoDatabase.tables[Collection.COMMENT].tableName,
    );
    // this.dataInterface.setEndpoint(
    //     DataEndpoint.COURSE,
    //     syllabusSyncPipeline.dataWarehouse.tableName,
    // );

    this.operationInterface.setEndpoint(OperationEndpoint.SYLLABUS, {
      [syllabusDataPipeline.processor.stateMachineArn]: 'scraper',
    });
  }
}

// Note: These are the magic words to disconnect cross stack referencing.
// this.exportValue(dynamoDatabase.tables[Collection.THREAD].tableName);
// this.exportValue(dynamoDatabase.tables[Collection.THREAD].tableArn);
// Then comment out setEndpoint and getEndpoint for the matching use case
// setEndpoint is in stack persistence and getEndpoint is in business
// after deploying, then delete or modify the table in need.
// then un comment them back.
