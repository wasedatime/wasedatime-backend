import * as cdk from "@aws-cdk/core";
import {Alarm, ComparisonOperator, Metric} from "@aws-cdk/aws-cloudwatch";
import {Topic} from "@aws-cdk/aws-sns";
import {SnsAction} from "@aws-cdk/aws-cloudwatch-actions";


export interface MonitorProps {

    targets: { [name: string]: string };
}

export abstract class AbstractMonitor extends cdk.Construct {

    abstract readonly alarms: { [name: string]: Alarm };

    abstract readonly targets: { [name: string]: string };

    abstract readonly topic: Topic;

    protected constructor(scope: cdk.Construct, id: string, props: MonitorProps) {
        super(scope, id);
    }
}

export class DynamoCapacityMonitor extends AbstractMonitor {

    readonly alarms: { [name: string]: Alarm };

    readonly targets: { [name: string]: string };

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: MonitorProps) {
        super(scope, id, props);

        this.topic = new Topic(this, 'db-alarm', {
            topicName: "dynamo-db-alarm"
        });

        const courseReviewAlarm: Alarm = new Alarm(this, 'course-review-alarm', {
            evaluationPeriods: 5,
            metric: new Metric({
                metricName: "ConsumedWriteCapacityUnits",
                namespace: "AWS/DynamoDB",
                period: cdk.Duration.minutes(1),
                statistic: "Sum",
                dimensions: {['TableName']: this.targets["course-review"]},
                region: process.env.AWS_REGION
            }),
            threshold: 240,
            actionsEnabled: true,
            alarmDescription: "Alarm for DynamoDB capacity overload.",
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            datapointsToAlarm: 5
        });
        courseReviewAlarm.addAlarmAction(new SnsAction(this.topic));

        const syllabusAlarm = new Alarm(this, 'waseda-syllabus-alarm', {
            evaluationPeriods: 5,
            metric: new Metric({
                metricName: "ConsumedWriteCapacityUnits",
                namespace: "AWS/DynamoDB",
                period: cdk.Duration.minutes(1),
                statistic: "Sum",
                dimensions: {['TableName']: this.targets["waseda-syllabus"]},
                region: process.env.AWS_REGION
            }),
            threshold: 240,
            actionsEnabled: true,
            alarmDescription: "Alarm for DynamoDB capacity overload.",
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            datapointsToAlarm: 5
        });
        syllabusAlarm.addAlarmAction(new SnsAction(this.topic));
    }
}

export class ApiAvailabilityMonitor extends AbstractMonitor {

    readonly alarms: { [name: string]: Alarm };

    readonly targets: { [name: string]: string };

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: MonitorProps) {
        super(scope, id, props);
    }
}

export class S3RequestMonitor extends AbstractMonitor {

    readonly alarms: { [name: string]: Alarm };

    readonly targets: { [name: string]: string };

    readonly topic: Topic;

    constructor(scope: cdk.Construct, id: string, props: MonitorProps) {
        super(scope, id, props);
    }
}