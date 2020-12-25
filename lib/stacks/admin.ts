import * as cdk from "@aws-cdk/core";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/common/registry";
import {
    AbstractStatusNotifier,
    AmplifyBuildStatusNotifier,
    StackStatusNotifier,
    StatusNotifier,
    SyllabusScraperStatusNotifier
} from "../constructs/admin/status-notifier";


export class WasedaTimeAdminLayer extends AdminLayer {

    readonly statusNotifiers: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    // readonly monitors: { [name in StatusNotifier]?: AbstractStatusNotifier } = {};

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {

        super(scope, id, operationInterface, props);

        this.statusNotifiers[StatusNotifier.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP)
        });

        this.statusNotifiers[StatusNotifier.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });

        this.statusNotifiers[StatusNotifier.CFN_STATUS] = new StackStatusNotifier(this, 'cfn-notifier', {});
    }
}