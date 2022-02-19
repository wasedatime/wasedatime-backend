import * as budgets from 'aws-cdk-lib/aws-budgets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import {
  BudgetType,
  ComparisonOperator,
  NotificationType,
  SubscriptionType,
  TimeUnit,
} from '../../configs/budgets/enum';
import { AwsServicePrincipal } from '../../configs/common/aws';

export abstract class AbstractBudgetGroup extends Construct {
  abstract readonly notification: sns.Topic;

  protected constructor(scope: Construct, id: string) {
    super(scope, id);
  }
}

export class FreeTierUsageBudget extends AbstractBudgetGroup {
  readonly notification: sns.Topic;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.notification = new sns.Topic(this, 'budget-notification-topic', {
      topicName: 'free-tier-budgets',
    });
    this.notification.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSBudgetsSNSPublishingPermissions',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal(AwsServicePrincipal.BUDGET)],
      actions: ['SNS:Publish'],
      resources: [this.notification.topicArn],
    }));

    const subscribers = [{
      subscriptionType: SubscriptionType.EMAIL,
      address: 'admin@wasedatime.com',
    }, {
      subscriptionType: SubscriptionType.SNS,
      address: this.notification.topicArn,
    }];

    const criteria = [{
      notification: {
        notificationType: NotificationType.ACTUAL,
        threshold: 80,
        comparisonOperator: ComparisonOperator.GREATER_THAN,
      },
      subscribers: subscribers,
    }];

    new budgets.CfnBudget(this, 'amplify-build-time', {
      budget: {
        budgetName: 'Amplify Build Time',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 1000,
          unit: 'Minutes',
        },
        costFilters: {
          'UsageType:AWS Amplify': ['APN1-BuildDuration'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'lambda-runtime', {
      budget: {
        budgetName: 'Lambda Runtime',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 400000,
          unit: 'Second',
        },
        costFilters: {
          'UsageType:AWS Lambda': ['APN1-Lambda-GB-Second'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'lambda-requests', {
      budget: {
        budgetName: 'Lambda Requests',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 1000000,
          unit: 'Requests',
        },
        costFilters: {
          'UsageType:AWS Lambda': ['APN1-Request'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'data-out', {
      budget: {
        budgetName: 'Data Transfer Out',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 15,
          unit: 'GB',
        },
        costFilters: {
          UsageType: ['APN1-DataTransfer-Out-Bytes'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'api-gateway-requests', {
      budget: {
        budgetName: 'API Gateway Requests',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 1000000,
          unit: 'APN1-ApiGatewayRequest',
        },
        costFilters: {
          'UsageType:Amazon API Gateway': ['APN1-ApiGatewayRequest'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 's3-storage', {
      budget: {
        budgetName: 'S3 Storage',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 5,
          unit: 'GB',
        },
        costFilters: {
          'UsageType:Amazon Simple Storage Service': ['APN1-TimedStorage-ByteHrs'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 's3-requests-tier1', {
      budget: {
        budgetName: 'S3 Requests Tier1',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 2000,
          unit: 'Requests',
        },
        costFilters: {
          'UsageType:Amazon Simple Storage Service': ['APN1-Requests-Tier1'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 's3-requests-tier2', {
      budget: {
        budgetName: 'S3 Requests Tier2',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 20000,
          unit: 'Requests',
        },
        costFilters: {
          'UsageType:Amazon Simple Storage Service': ['APN1-Requests-Tier2'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'dynamodb-storage', {
      budget: {
        budgetName: 'DynamoDB Storage',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 25,
          unit: 'GB-Month',
        },
        costFilters: {
          'UsageType:Amazon DynamoDB': ['APN1-TimedStorage-ByteHrs'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'cognito-user-pool', {
      budget: {
        budgetName: 'Cognito User Pool Requests',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 50000,
          unit: 'Requests',
        },
        costFilters: {
          'UsageType:Amazon Cognito': ['APN1-CognitoUserPoolsMAU'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'kms-request', {
      budget: {
        budgetName: 'KMS Requests',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 20000,
          unit: 'Requests',
        },
        costFilters: {
          'UsageType:AWS Key Management Service': ['ap-northeast-1-KMS-Requests'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'sns-http-notification', {
      budget: {
        budgetName: 'SNS Notifications',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 20000,
          unit: 'Notifications',
        },
        costFilters: {
          'UsageType:Amazon Simple Notification Service': ['APN1-DeliveryAttempts-HTTP'],
        },
      },
      notificationsWithSubscribers: criteria,
    });

    new budgets.CfnBudget(this, 'state-machine-transitions', {
      budget: {
        budgetName: 'State Transitions',
        budgetType: BudgetType.USAGE,
        timeUnit: TimeUnit.MONTHLY,
        budgetLimit: {
          amount: 4000,
          unit: 'StateTransitions',
        },
        costFilters: {
          'UsageType:AWS Step Functions': ['APN1-StateTransition'],
        },
      },
      notificationsWithSubscribers: criteria,
    });
  }
}
