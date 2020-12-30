import {SlackChannelConfiguration} from "@aws-cdk/aws-chatbot/lib/slack-channel-configuration";
import {SLACK_CHANNEL_ID, SLACK_WORKSPACE_ID} from "../../configs/chatbot/slack";
import * as cdk from "@aws-cdk/core";
import {Topic} from "@aws-cdk/aws-sns";


export interface AlarmNotifierProps {

    topics: Topic[]
}

export class AlarmNotifier extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: AlarmNotifierProps) {
        super(scope, id);

        new SlackChannelConfiguration(this, 'chatbot-slack-config', {
            slackChannelConfigurationName: 'aws-alert',
            slackChannelId: SLACK_CHANNEL_ID,
            slackWorkspaceId: SLACK_WORKSPACE_ID,
            notificationTopics: props.topics
        });
    }
}