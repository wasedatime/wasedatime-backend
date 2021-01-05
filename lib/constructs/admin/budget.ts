import * as cdk from '@aws-cdk/core';
import {CfnBudget} from '@aws-cdk/aws-budgets';
import {Topic} from "@aws-cdk/aws-sns";

import {BudgetType, ComparisonOperator, NotificationType, SubscriptionType, TimeUnit} from "../../configs/budgets/enum";
import {Effect, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {AwsServicePrincipal} from "../../configs/common/aws";


export abstract class AbstractBudgetGroup extends cdk.Construct {

    abstract readonly notification: Topic;

    protected constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
    }
}

export class FreeTierUsageBudget extends AbstractBudgetGroup {

    readonly notification: Topic;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.notification = new Topic(this, 'budget-notification-topic', {
            topicName: "free-tier-budgets"
        });
        this.notification.addToResourcePolicy(new PolicyStatement({
            sid: "AWSBudgetsSNSPublishingPermissions",
            effect: Effect.ALLOW,
            principals: [new ServicePrincipal(AwsServicePrincipal.BUDGET)],
            actions: ["SNS:Publish"],
            resources: [this.notification.topicArn]
        }));

        new CfnBudget(this, 'amplify-build-time', {
            budget: {
                budgetName: "Amplify Build Time",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 1000,
                    unit: 'Minutes'
                },
                costFilters: {
                    Amplify: "APN1-BuildDuration (Minutes)"
                }
            },
            notificationsWithSubscribers: [{
                notification: {
                    notificationType: NotificationType.ACTUAL,
                    threshold: 80,
                    comparisonOperator: ComparisonOperator.GREATER_THAN
                },
                subscribers: [{
                    subscriptionType: SubscriptionType.EMAIL,
                    address: "admin@wasedatime.com"
                }, {
                    subscriptionType: SubscriptionType.SNS,
                    address: this.notification.topicArn
                }]
            }]
        });
    }
}