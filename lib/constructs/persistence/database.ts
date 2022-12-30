import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export enum Collection {
  COURSE_REVIEW,
  CAREER,
  FEEDS,
  SYLLABUS,
  TIMETABLE,
  THREAD,
  COMMENT,
}

export class DynamoDatabase extends Construct {
  readonly tables: { [name: number]: dynamodb.Table } = {};

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.tables[Collection.COURSE_REVIEW] = new dynamodb.Table(
      this,
      'dynamodb-review-table',
      {
        partitionKey: {
          name: 'course_key',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        tableName: 'course-review',
        readCapacity: 10,
        writeCapacity: 7,
        pointInTimeRecovery: true,
      },
    );

    this.tables[Collection.CAREER] = new dynamodb.Table(
      this,
      'dynamodb-career-table',
      {
        partitionKey: { name: 'type', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        tableName: 'career',
        readCapacity: 1,
        writeCapacity: 1,
      },
    );

    this.tables[Collection.FEEDS] = new dynamodb.Table(
      this,
      'dynamodb-feeds-table',
      {
        partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        tableName: 'feeds',
        readCapacity: 1,
        writeCapacity: 1,
      },
    );

    this.tables[Collection.TIMETABLE] = new dynamodb.Table(
      this,
      'dynamodb-timetable-table',
      {
        partitionKey: { name: 'uid', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        tableName: 'timetable',
        readCapacity: 12,
        writeCapacity: 15,
        pointInTimeRecovery: true,
      },
    );

    this.tables[Collection.THREAD] = new dynamodb.Table(
      this,
      'dynamodb-thread-table',
      {
        partitionKey: {
          name: 'board_id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        tableName: 'forum-threads',
        readCapacity: 15,
        writeCapacity: 15,
        pointInTimeRecovery: true,
      },
    );

    this.tables[Collection.THREAD].addLocalSecondaryIndex({
      indexName: 'GroupIndex',
      sortKey: { name: 'group_id', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // this.tables[Collection.THREAD].addLocalSecondaryIndex({
    //   indexName: 'TagIndex',
    //   sortKey: { name: 'tag_id', type: dynamodb.AttributeType.NUMBER },
    //   projectionType: dynamodb.ProjectionType.ALL,
    // });

    // this.tables[Collection.THREAD].addGlobalSecondaryIndex({
    //   indexName: "UidbyCreated_at",
    //   partitionKey: { name: "uid", type: dynamodb.AttributeType.STRING },
    //   sortKey: { name: "created_at", type: dynamodb.AttributeType.NUMBER },
    //   projectionType: dynamodb.ProjectionType.ALL,
    // });

    this.tables[Collection.COMMENT] = new dynamodb.Table(
      this,
      'dynamodb-comment-table',
      {
        partitionKey: {
          name: 'thread_id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PROVISIONED,
        encryption: dynamodb.TableEncryption.DEFAULT,
        removalPolicy: RemovalPolicy.RETAIN,
        sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
        tableName: 'forum-comments',
        readCapacity: 10,
        writeCapacity: 7,
        pointInTimeRecovery: true,
      },
    );
  }
}
