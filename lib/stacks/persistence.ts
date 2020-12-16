import * as cdk from "@aws-cdk/core";
import {Bucket} from "@aws-cdk/aws-s3";

import {AbstractDataPipeline} from "../constructs/data-pipeline";


export abstract class PersistenceLayer extends cdk.Stack {

    abstract dataPipelines: { [name: string]: AbstractDataPipeline };

    abstract repository: Bucket;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }
}

export class WasedaTimePersistenceLayer extends PersistenceLayer {

    readonly dataPipelines: { [name: string]: AbstractDataPipeline };

    readonly repository: Bucket;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }
}