import * as cdk from "@aws-cdk/core";

import {AdminLayer} from "../architecture/layers";
import {OperationInterface} from "../architecture/interfaces";
import {OperationEndpoint} from "../configs/registry";
import {
    AbstractTaskManager,
    AmplifyBuildStatusNotifier,
    SyllabusScraperStatusNotifier,
    SyllabusScraperTaskManger,
    TaskManager
} from "../constructs/task-managers";

export class WasedaTimeAdminLayer extends AdminLayer {

    readonly taskManagers: { [name in TaskManager]?: AbstractTaskManager } = {};

    constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props: cdk.StackProps) {
        super(scope, id, operationInterface, props);

        this.taskManagers[TaskManager.SCRAPER_TASK] = new SyllabusScraperTaskManger(this, 'scraper-task', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });

        this.taskManagers[TaskManager.BUILD_STATUS] = new AmplifyBuildStatusNotifier(this, 'build-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.APP)
        });

        this.taskManagers[TaskManager.SCRAPER_STATUS] = new SyllabusScraperStatusNotifier(this, 'scraper-notifier', {
            target: this.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        });
    }
}