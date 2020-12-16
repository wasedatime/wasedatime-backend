import * as cdk from "@aws-cdk/core";
import {Bucket} from "@aws-cdk/aws-s3";

import {AbstractDataPipeline, SyllabusDataPipeline} from "../constructs/data-pipeline";
import {Table} from "@aws-cdk/aws-dynamodb";


export abstract class PersistenceLayer extends cdk.Stack {

    abstract dataPipelines: { [name: string]: AbstractDataPipeline };

    protected constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }

    abstract getStorageByName(name: string): Bucket | Table;
}

export class WasedaTimePersistenceLayer extends PersistenceLayer {

    readonly dataPipelines: { [name: string]: AbstractDataPipeline } = {};

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.dataPipelines["syllabus"] = new SyllabusDataPipeline(this, 'syllabus-datapipeline', {});
    }

    getStorageByName(name: string): Bucket | Table {
        return this.dataPipelines[name].dataWarehouse;
    }
}