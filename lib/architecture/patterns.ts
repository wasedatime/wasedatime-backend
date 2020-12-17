import * as cdk from "@aws-cdk/core";

import {AdminLayer, BusinessLayer, PersistenceLayer, PresentationLayer} from "./layers";


export abstract class AbstractServerlessApp extends cdk.App {

    abstract presentationLayer: PresentationLayer;

    abstract businessLayer: BusinessLayer;

    abstract persistenceLayer: PersistenceLayer;

    abstract adminLayer: AdminLayer;

}
