import * as cdk from "@aws-cdk/core";
import {Topic} from "@aws-cdk/aws-sns";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/common/registry";
import {
    AbstractStatusNotifier,
    AmplifyBuildStatusNotifier,
    StatusNotifier,
    SyllabusScraperStatusNotifier,
} from "../constructs/admin/status-notifier";
import {FreeTierUsageBudget} from "../constructs/admin/budget";
import {CF_TOPIC_ARN} from "../configs/common/arn";
import {GlobalTrailLogs} from "../constructs/admin/log";
import {SlackChatbot} from "../constructs/admin/chatbot";


export class WasedaTimeAdminLayer extends AdminLayer {

    readonly statusNotifiers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    readonly chatbot: SlackChatbot;

    readonly trail: GlobalTrailLogs;

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {
        super(scope, id, operationInterface, props);

        this.statusNotifiers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP),
        });
        this.statusNotifiers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS),
        });

        const freeTierBudget = new FreeTierUsageBudget(this, 'free-tier-budget');

        this.chatbot = new SlackChatbot(this, 'slack-chatbot', [
            freeTierBudget.notification,
            Topic.fromTopicArn(this, 'stack-topic', CF_TOPIC_ARN),
        ]);

        this.trail = new GlobalTrailLogs(this, 'cloudtrail-logs');
    }
}