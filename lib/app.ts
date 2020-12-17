import {WasedaTimePresentationLayer} from "./stacks/presentation";
import {awsEnv} from "./configs/aws";
import {AbstractServerlessApp} from "./architecture/patterns";
import {WasedaTimeServiceLayer} from "./stacks/service";
import {WasedaTimePersistenceLayer} from "./stacks/persistence";
import {PersistenceLayer, PresentationLayer, ServiceLayer} from "./architecture/layers";


export class WasedaTime extends AbstractServerlessApp {

    readonly presentationLayer: PresentationLayer;

    readonly serviceLayer: ServiceLayer;

    readonly persistenceLayer: PersistenceLayer;

    constructor() {

        super();

        this.persistenceLayer = new WasedaTimePersistenceLayer(this, 'persistence', awsEnv);
        const dataInterface = this.persistenceLayer.dataInterface;

        this.serviceLayer = new WasedaTimeServiceLayer(this, 'service', dataInterface, awsEnv);
        this.serviceLayer.dataInterface = dataInterface;
        const serviceInterface = this.serviceLayer.serviceInterface;

        this.presentationLayer = new WasedaTimePresentationLayer(this, 'presentation', serviceInterface, awsEnv);
        this.presentationLayer.serviceInterface = serviceInterface;
    }
}