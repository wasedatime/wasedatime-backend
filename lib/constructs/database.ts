import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import * as cdk from "@aws-cdk/core";


export enum Collection {
    COURSE_REVIEW
}

export interface DatabaseProps {

}

export class DynamoDatabase extends cdk.Construct {

    readonly tables: { [name: number]: Table } = {};

    constructor(scope: cdk.Construct, id: string, props?: DatabaseProps) {
        super(scope, id);

        this.tables[Collection.COURSE_REVIEW] = new Table(this, 'dynamodb-review-table', {
            partitionKey: {name: "course_key", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            readCapacity: 5,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "timestamp", type: AttributeType.STRING},
            tableName: "course-review",
            writeCapacity: 5
        });
    }
}

