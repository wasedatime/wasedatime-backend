import * as cdk from "@aws-cdk/core";

import {AbstractDataPipeline, SyllabusDataPipeline, Worker} from "../constructs/data-pipeline";
import {DataEndpoint, OperationEndpoint} from "../configs/registry";
import {PersistenceLayer} from "../architecture/layers";
import {Collection, DynamoDatabase} from "../constructs/database";


export class WasedaTimePersistenceLayer extends PersistenceLayer {

    readonly dataPipelines: { [name in Worker]?: AbstractDataPipeline } = {};

    readonly databases: { [name: string]: DynamoDatabase };

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const syllabusDatePipeline = new SyllabusDataPipeline(this, 'syllabus-datapipeline', {});
        this.dataPipelines[Worker.SYLLABUS] = syllabusDatePipeline;

        const dynamoDatabase = new DynamoDatabase(this, 'dynamo-db', {});

        this.dataInterface.setEndpoint(
            DataEndpoint.COURSE_REVIEWS,
            dynamoDatabase.tables[Collection.COURSE_REVIEW].tableArn
        );

        this.dataInterface.setEndpoint(
            DataEndpoint.SYLLABUS,
            syllabusDatePipeline.dataWarehouse.bucketRegionalDomainName
        );

        this.operationInterface.setEndpoint(
            OperationEndpoint.SYLLABUS,
            syllabusDatePipeline.processor.stateMachineArn
        );
    }
}