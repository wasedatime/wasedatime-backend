import * as cdk from "@aws-cdk/core";
import {Duration} from "@aws-cdk/core";
import {Alarm, Metric} from "@aws-cdk/aws-cloudwatch";

export class DynamoCapacityMonitor extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string, table: string) {
        super(scope, id);

        new Alarm(this, 'course-review-alarm', {
            evaluationPeriods: 5,
            metric: new Metric({
                metricName: "ConsumedWriteCapacityUnits",
                namespace: "AWS/DynamoDB",
                period: Duration.minutes(1),
                statistic: "Sum"
            }),
            threshold: 240,
            actionsEnabled: true,

        })
    }
}