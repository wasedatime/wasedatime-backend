import {PresentationLayer, WasedaTimePresentationLayer} from "./stacks/presentation";
import {awsEnv} from "./configs/aws";
import {AbstractServerlessApp} from "./stacks/architecture";
import {ServiceLayer, WasedaTimeServiceLayer} from "./stacks/service";
import {PersistenceLayer, WasedaTimePersistenceLayer} from "./stacks/persistence";


export class WasedaTime extends AbstractServerlessApp {

    readonly presentationLayer: PresentationLayer;

    readonly serviceLayer: ServiceLayer;

    readonly persistenceLayer: PersistenceLayer;

    constructor() {
        super();

        this.persistenceLayer = new WasedaTimePersistenceLayer(this, 'persistence', awsEnv);

        this.serviceLayer = new WasedaTimeServiceLayer(this, 'service', awsEnv);

        this.presentationLayer = new WasedaTimePresentationLayer(this, 'presentation', awsEnv);
    }
}