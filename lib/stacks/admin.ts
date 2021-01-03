import * as cdk from "@aws-cdk/core";
import {SlackChannelConfiguration} from "@aws-cdk/aws-chatbot/lib/slack-channel-configuration";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/common/registry";
import {
    AbstractStatusNotifier,
    AmplifyBuildStatusNotifier,
    StatusNotifier,
    SyllabusScraperStatusNotifier
} from "../constructs/admin/status-notifier";
import {SLACK_CHANNEL_ID, SLACK_WORKSPACE_ID} from "../configs/chatbot/slack";
import {FreeTierUsageBudget} from "../constructs/admin/budget";


export class WasedaTimeAdminLayer extends AdminLayer {

    readonly statusNotifiers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    readonly chatbot: SlackChannelConfiguration;

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {

        super(scope, id, operationInterface, props);

        this.statusNotifiers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP)
        });

        this.statusNotifiers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });

        const freeTierBudgetTopic = new FreeTierUsageBudget(this, 'free-tier-budget');

        this.chatbot = new SlackChannelConfiguration(this, 'chatbot-slack-config', {
            slackChannelConfigurationName: 'aws-alert',
            slackChannelId: SLACK_CHANNEL_ID,
            slackWorkspaceId: SLACK_WORKSPACE_ID,
            notificationTopics: [freeTierBudgetTopic.notification]
        });
    }
}