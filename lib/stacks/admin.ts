import * as cdk from "@aws-cdk/core";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/registry";
import {
    AbstractStatusNotifier,
    AmplifyBuildStatusNotifier,
    StackStatusNotifier,
    StatusNotifier,
    SyllabusScraperStatusNotifier
} from "../constructs/status-notifier";

export class WasedaTimeAdminLayer extends AdminLayer {

    readonly taskManagers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {

        super(scope, id, operationInterface, props);

        this.taskManagers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP)
        });

        this.taskManagers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });

        this.taskManagers[StatusNotifier.SCRAPER_STATUS] = new StackStatusNotifier(this, 'scraper-notifier', {});
    }
}