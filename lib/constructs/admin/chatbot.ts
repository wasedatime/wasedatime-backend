import * as cdk from "@aws-cdk/core";
import {SlackChannelConfiguration} from "@aws-cdk/aws-chatbot/lib/slack-channel-configuration";
import {ITopic} from "@aws-cdk/aws-sns";

import {SLACK_CHANNEL_ID, SLACK_WORKSPACE_ID} from "../../configs/chatbot/slack";

export class SlackChatbot extends cdk.Construct {

    readonly chatbot: SlackChannelConfiguration;

    constructor(scope: cdk.Construct, id: string, topics: ITopic[]) {
        super(scope, id);

        this.chatbot = new SlackChannelConfiguration(this, 'chatbot-slack-config', {
            slackChannelConfigurationName: 'aws-alert',
            slackChannelId: SLACK_CHANNEL_ID,
            slackWorkspaceId: SLACK_WORKSPACE_ID,
            notificationTopics: topics
        });
    }
}