import * as cdk from "@aws-cdk/core";

import {PresentationLayer} from "./presentation";
import {ServiceLayer} from "./service";
import {PersistenceLayer} from "./persistence";


export abstract class AbstractServerlessApp extends cdk.App {

    abstract presentationLayer: PresentationLayer;

    abstract serviceLayer: ServiceLayer;

    abstract persistenceLayer: PersistenceLayer;
}
