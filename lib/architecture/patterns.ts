import * as cdk from "@aws-cdk/core";

import {PersistenceLayer, PresentationLayer, ServiceLayer} from "./layers";


export abstract class AbstractServerlessApp extends cdk.App {

    abstract presentationLayer: PresentationLayer;

    abstract serviceLayer: ServiceLayer;

    abstract persistenceLayer: PersistenceLayer;
}
