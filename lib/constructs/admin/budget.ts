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

        const subscribers = [{
            subscriptionType: SubscriptionType.EMAIL,
            address: "admin@wasedatime.com"
        }, {
            subscriptionType: SubscriptionType.SNS,
            address: this.notification.topicArn
        }];

        const criteria = [{
            notification: {
                notificationType: NotificationType.ACTUAL,
                threshold: 80,
                comparisonOperator: ComparisonOperator.GREATER_THAN
            },
            subscribers: subscribers
        }];

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
                    "UsageType:Amplify": ["APN1-BuildDuration"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'lambda-runtime', {
            budget: {
                budgetName: "Lambda Runtime",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 400000,
                    unit: 'Second'
                },
                costFilters: {
                    "UsageType:Lambda": ["APN1-Lambda-GB-Second"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'lambda-requests', {
            budget: {
                budgetName: "Lambda Requests",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 1000000,
                    unit: 'Requests'
                },
                costFilters: {
                    "UsageType:Lambda": ["APN1-Request"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'data-out', {
            budget: {
                budgetName: "Data Transfer Out",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 15,
                    unit: 'GB'
                },
                costFilters: {
                    "UsageType:": [
                        "APN1-DataTransfer-Out-Bytes",
                        "DataTransfer-Out-Bytes",
                        "APN1-APS1-AWS-Out-Bytes",
                        "APN1-APS3-AWS-Out-Bytes",
                        "APN1-CloudFront-Out-Bytes",
                        "APN1-USE1-AWS-Out-Bytes",
                        "APN2-DataTransfer-Out-Bytes",
                        "APS2-DataTransfer-Out-Bytes",
                        "EU-DataTransfer-Out-Bytes",
                        "EUC1-DataTransfer-Out-Bytes",
                        "EUW2-DataTransfer-Out-Bytes",
                        "USE1-APE1-AWS-Out-Bytes",
                        "USE1-APN1-AWS-Out-Bytes",
                        "USW2-DataTransfer-Out-Bytes"
                    ]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'api-gateway-requests', {
            budget: {
                budgetName: "API Gateway Requests",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 1000000,
                    unit: 'APN1-ApiGatewayRequest'
                },
                costFilters: {
                    "UsageType:API Gateway": ["APN1-ApiGatewayRequest"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 's3-storage', {
            budget: {
                budgetName: "S3 Storage",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 5,
                    unit: 'GB'
                },
                costFilters: {
                    "UsageType:S3 (Simple Storage Service)": ["APN1-TimedStorage-ByteHrs"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 's3-requests-tier1', {
            budget: {
                budgetName: "S3 Requests Tier1",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 2000,
                    unit: 'Requests'
                },
                costFilters: {
                    "UsageType:S3 (Simple Storage Service)": ["APN1-Requests-Tier1", "Requests-Tier1"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 's3-requests-tier2', {
            budget: {
                budgetName: "S3 Requests Tier2",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 20000,
                    unit: 'Requests'
                },
                costFilters: {
                    "UsageType:S3 (Simple Storage Service)": ["APN1-Requests-Tier2", "Requests-Tier2"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'dynamodb-storage', {
            budget: {
                budgetName: "DynamoDB Storage",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 25,
                    unit: 'GB-Month'
                },
                costFilters: {
                    "UsageType:DynamoDB": ["APN1-TimedStorage-ByteHrs"]
                }
            },
            notificationsWithSubscribers: criteria
        });

        new CfnBudget(this, 'cognito-user-pool', {
            budget: {
                budgetName: "Cognito User Pool Requests",
                budgetType: BudgetType.USAGE,
                timeUnit: TimeUnit.MONTHLY,
                budgetLimit: {
                    amount: 50000,
                    unit: 'Requests'
                },
                costFilters: {
                    "UsageType:Cognito": ["APN1-CognitoUserPoolsMAU"]
                }
            },
            notificationsWithSubscribers: criteria
        });
    }
}