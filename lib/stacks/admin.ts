import { StackProps } from 'aws-cdk-lib';
import * as chatbot from 'aws-cdk-lib/aws-chatbot';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { OperationInterface } from '../architecture/interfaces';
import { AdminLayer } from '../architecture/layers';
import { SLACK_CHANNEL_ID, SLACK_WORKSPACE_ID } from '../configs/chatbot/slack';
import { CF_TOPIC_ARN } from '../configs/common/arn';
import { OperationEndpoint } from '../configs/common/registry';
import { FreeTierUsageBudget } from '../constructs/admin/budget';
import { GlobalTrailLogs } from '../constructs/admin/log';
import {
  AbstractStatusNotifier,
  AmplifyBuildStatusNotifier,
  StatusNotifier,
  SyllabusScraperStatusNotifier,
} from '../constructs/admin/status-notifier';

export class WasedaTimeAdminLayer extends AdminLayer {
  readonly statusNotifiers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};
  readonly chatbot: chatbot.SlackChannelConfiguration;
  readonly trail: GlobalTrailLogs;

  constructor(scope: Construct, id: string, operationInterface: OperationInterface, props: StackProps) {
    super(scope, id, operationInterface, props);

    this.statusNotifiers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
      targets: this.operationInterface.getEndpoint(OperationEndpoint.APP),
    });
    this.statusNotifiers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
      targets: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS),
    });

    const freeTierBudget = new FreeTierUsageBudget(this, 'free-tier-budget');

    this.chatbot = new chatbot.SlackChannelConfiguration(this, 'chatbot-slack-config', {
      slackChannelConfigurationName: 'aws-alert',
      slackChannelId: SLACK_CHANNEL_ID,
      slackWorkspaceId: SLACK_WORKSPACE_ID,
      notificationTopics: [
        freeTierBudget.notification,
        sns.Topic.fromTopicArn(this, 'stack-topic', CF_TOPIC_ARN),
      ],
    });

    this.trail = new GlobalTrailLogs(this, 'cloudtrail-logs');
  }
}
