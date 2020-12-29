import * as cdk from "@aws-cdk/core";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";


export enum Collection {
    COURSE_REVIEW,
    CAREER,
    FEEDS,
    SYLLABUS
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
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "course-review",
            readCapacity: 5,
            writeCapacity: 5
        });

        this.tables[Collection.CAREER] = new Table(this, 'dynamodb-career-table', {
            partitionKey: {name: "type", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "career",
            readCapacity: 1,
            writeCapacity: 1
        });

        this.tables[Collection.FEEDS] = new Table(this, 'dynamodb-feeds-table', {
            partitionKey: {name: "category", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "feeds",
            readCapacity: 1,
            writeCapacity: 1
        });

        this.tables[Collection.SYLLABUS] = new Table(this, 'dynamodb-syllabus-table', {
            partitionKey: {name: "dept", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            sortKey: {name: "a", type: AttributeType.STRING},
            tableName: "waseda-syllabus",
            readCapacity: 5,
            writeCapacity: 5
        });
    }
}

