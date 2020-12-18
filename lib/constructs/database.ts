import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";
import * as cdk from "@aws-cdk/core";


export enum Collection {
    COURSE_REVIEW,
    CAREER,
    FEEDS
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
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "timestamp", type: AttributeType.STRING},
            tableName: "course-review",
            readCapacity: 5,
            writeCapacity: 5
        });

        this.tables[Collection.CAREER] = new Table(this, 'dynamodb-career-table', {
            partitionKey: {name: "type", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "date_updated", type: AttributeType.STRING},
            tableName: "career-info",
            readCapacity: 1,
            writeCapacity: 1
        });

        this.tables[Collection.FEEDS] = new Table(this, 'dynamodb-feeds-table', {
            partitionKey: {name: "category", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "date_updated", type: AttributeType.STRING},
            tableName: "article-info",
            readCapacity: 1,
            writeCapacity: 1
        });
    }
}

