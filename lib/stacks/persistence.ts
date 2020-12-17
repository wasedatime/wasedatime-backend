import * as cdk from "@aws-cdk/core";

import {AbstractDataPipeline, SyllabusDataPipeline} from "../constructs/data-pipeline";
import {DataEndpoint, Worker} from "../configs/registry";
import {PersistenceLayer} from "../architecture/layers";


export class WasedaTimePersistenceLayer extends PersistenceLayer {

    readonly dataPipelines: { [name in Worker]?: AbstractDataPipeline } = {};

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const syllabusDatePipeline = new SyllabusDataPipeline(this, 'syllabus-datapipeline', {});
        this.dataPipelines[Worker.SYLLABUS] = syllabusDatePipeline;

        this.dataInterface.setEndpoint(DataEndpoint.SYLLABUS,
            syllabusDatePipeline.dataWarehouse.bucketRegionalDomainName);
    }
}