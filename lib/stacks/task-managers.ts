import * as cdk from '@aws-cdk/core';
import {Rule, Schedule} from "@aws-cdk/aws-events";

export class SyllabusScraperTaskRules extends cdk.Stack {

    private rules: { [key: string]: Rule }

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // todo targets
        const regular = new Rule(this, 'regular', {
            description: "Execute the syllabus scraper every month.",
            enabled: true,
            schedule: Schedule.cron({
                minute: '0', hour: '16', day: '1', month: '*', weekDay: '?', year: '*'
            })
        })
    }
}