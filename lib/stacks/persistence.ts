import * as cdk from "@aws-cdk/core";

import {
    AbstractDataPipeline,
    CareerDataPipeline,
    FeedsDataPipeline,
    SyllabusDataPipeline,
    Worker
} from "../constructs/persistence/data-pipeline";
import {DataEndpoint, OperationEndpoint} from "../configs/common/registry";
import {PersistenceLayer} from "../architecture/layers";
import {Collection, DynamoDatabase} from "../constructs/persistence/database";


export class WasedaTimePersistenceLayer extends PersistenceLayer {

    readonly dataPipelines: { [name in Worker]?: AbstractDataPipeline } = {};

    readonly databases: { [name: string]: DynamoDatabase } = {};

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const syllabusDatePipeline = new SyllabusDataPipeline(this, 'syllabus-datapipeline', {});
        this.dataPipelines[Worker.SYLLABUS] = syllabusDatePipeline;

        const dynamoDatabase = new DynamoDatabase(this, 'dynamo-db', {});
        this.databases["dynamo-main"] = dynamoDatabase;

        this.dataPipelines[Worker.CAREER] = new CareerDataPipeline(this, 'career-datapipeline', {
            dataWarehouse: dynamoDatabase.tables[Collection.CAREER]
        });
        this.dataPipelines[Worker.FEEDS] = new FeedsDataPipeline(this, 'feeds-datapipeline', {
            dataWarehouse: dynamoDatabase.tables[Collection.FEEDS]
        });

        this.dataInterface.setEndpoint(
            DataEndpoint.COURSE_REVIEWS,
            dynamoDatabase.tables[Collection.COURSE_REVIEW].tableName
        );
        this.dataInterface.setEndpoint(
            DataEndpoint.FEEDS,
            dynamoDatabase.tables[Collection.FEEDS].tableName
        );
        this.dataInterface.setEndpoint(
            DataEndpoint.CAREER,
            dynamoDatabase.tables[Collection.CAREER].tableName
        );

        this.dataInterface.setEndpoint(
            DataEndpoint.TIMETABLE,
            dynamoDatabase.tables[Collection.TIMETABLE].tableName
        );

        this.dataInterface.setEndpoint(
            DataEndpoint.SYLLABUS,
            syllabusDatePipeline.dataWarehouse.bucketName
        );

        this.operationInterface.setEndpoint(
            OperationEndpoint.SYLLABUS,
            syllabusDatePipeline.processor.stateMachineArn
        );
    }
}