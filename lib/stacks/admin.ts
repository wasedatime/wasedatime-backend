import * as cdk from "@aws-cdk/core";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/common/registry";
import {
    AbstractStatusNotifier,
    AmplifyBuildStatusNotifier,
    StatusNotifier,
    SyllabusScraperStatusNotifier
} from "../constructs/admin/status-notifier";
import {AbstractMonitor} from "../constructs/admin/monitor";


export class WasedaTimeAdminLayer extends AdminLayer {

    readonly statusNotifiers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    readonly monitors: { [name: string]: AbstractMonitor } = {};

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {

        super(scope, id, operationInterface, props);

        this.statusNotifiers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP)
        });

        this.statusNotifiers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });
    }
}