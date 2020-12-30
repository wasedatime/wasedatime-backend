import {WasedaTimePresentationLayer} from "./stacks/presentation";
import {awsEnv} from "./configs/common/aws";
import {AbstractServerlessApp} from "./architecture/patterns";
import {WasedaTimeBusinessLayer} from "./stacks/business";
import {WasedaTimePersistenceLayer} from "./stacks/persistence";
import {AdminLayer, BusinessLayer, PersistenceLayer, PresentationLayer} from "./architecture/layers";
import {WasedaTimeAdminLayer} from "./stacks/admin";
import {OperationInterface} from "./architecture/interfaces";
import {OperationEndpoint} from "./configs/common/registry";


export class WasedaTime extends AbstractServerlessApp {

    readonly presentationLayer: PresentationLayer;

    readonly businessLayer: BusinessLayer;

    readonly persistenceLayer: PersistenceLayer;

    readonly adminLayer: AdminLayer;

    constructor() {

        super();

        this.persistenceLayer = new WasedaTimePersistenceLayer(this, 'persistence', awsEnv);
        const dataInterface = this.persistenceLayer.dataInterface;

        this.businessLayer = new WasedaTimeBusinessLayer(this, 'business', dataInterface, awsEnv);
        this.businessLayer.dataInterface = dataInterface;
        const serviceInterface = this.businessLayer.serviceInterface;

        this.presentationLayer = new WasedaTimePresentationLayer(this, 'presentation', serviceInterface, awsEnv);
        this.presentationLayer.serviceInterface = serviceInterface;

        const operationInterface = new OperationInterface;

        operationInterface.setEndpoint(
            OperationEndpoint.SYLLABUS,
            this.persistenceLayer.operationInterface.getEndpoint(OperationEndpoint.SYLLABUS)
        );
        operationInterface.setEndpoint(
            OperationEndpoint.APP,
            this.presentationLayer.operationInterface.getEndpoint(OperationEndpoint.APP)
        );

        this.adminLayer = new WasedaTimeAdminLayer(this, 'admin', operationInterface, awsEnv);
    }
}