import * as cdk from "@aws-cdk/core";

import {
    AbstractDataPipeline,
    CareerDataPipeline,
    SyllabusDataPipeline,
    SyllabusSyncPipeline,
    Worker,
} from "../constructs/persistence/data-pipeline";
import {DataEndpoint, OperationEndpoint} from "../configs/common/registry";
import {PersistenceLayer} from "../architecture/layers";
import {Collection, DynamoDatabase} from "../constructs/persistence/database";

export class WasedaTimePersistenceLayer extends PersistenceLayer {
    readonly dataPipelines: { [name in Worker]?: AbstractDataPipeline } = {};

    readonly databases: { [name: string]: DynamoDatabase } = {};

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const syllabusDataPipeline = new SyllabusDataPipeline(this, 'syllabus-datapipeline', {});
        this.dataPipelines[Worker.SYLLABUS] = syllabusDataPipeline;

        const syllabusSyncPipeline = new SyllabusSyncPipeline(this, 'syllabus-sync', {
            dataSource: syllabusDataPipeline.dataWarehouse,
        });

        const dynamoDatabase = new DynamoDatabase(this, 'dynamo-db', {});
        this.databases["dynamo-main"] = dynamoDatabase;

        this.dataPipelines[Worker.CAREER] = new CareerDataPipeline(this, 'career-datapipeline', {
            dataWarehouse: dynamoDatabase.tables[Collection.CAREER],
        });

        this.dataInterface.setEndpoint(
            DataEndpoint.COURSE_REVIEWS,
            dynamoDatabase.tables[Collection.COURSE_REVIEW].tableName,
        );
        this.exportValue(dynamoDatabase.tables[Collection.FEEDS].tableName);
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
        this.exportValue(syllabusSyncPipeline.dataWarehouse.tableName);
        // this.dataInterface.setEndpoint(
        //     DataEndpoint.COURSE,
        //     syllabusSyncPipeline.dataWarehouse.tableName,
        // );

        this.operationInterface.setEndpoint(
            OperationEndpoint.SYLLABUS,
            {
                [syllabusDataPipeline.processor.stateMachineArn]: "scraper",
            },
        );
    }
}
