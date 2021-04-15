import * as cdk from "@aws-cdk/core";
import {AttributeType, BillingMode, Table, TableEncryption} from "@aws-cdk/aws-dynamodb";


export enum Collection {
    COURSE_REVIEW,
    CAREER,
    FEEDS,
    SYLLABUS,
    TIMETABLE,
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
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "course-review",
            readCapacity: 10,
            writeCapacity: 7,
            pointInTimeRecovery: true,
        });

        this.tables[Collection.CAREER] = new Table(this, 'dynamodb-career-table', {
            partitionKey: {name: "type", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "career",
            readCapacity: 1,
            writeCapacity: 1,
        });

        this.tables[Collection.FEEDS] = new Table(this, 'dynamodb-feeds-table', {
            partitionKey: {name: "category", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            sortKey: {name: "created_at", type: AttributeType.STRING},
            tableName: "feeds",
            readCapacity: 1,
            writeCapacity: 1,
        });

        this.tables[Collection.TIMETABLE] = new Table(this, 'dynamodb-timetable-table', {
            partitionKey: {name: "uid", type: AttributeType.STRING},
            billingMode: BillingMode.PROVISIONED,
            encryption: TableEncryption.DEFAULT,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            tableName: "timetable",
            readCapacity: 12,
            writeCapacity: 15,
            pointInTimeRecovery: true,
        });
    }
}

