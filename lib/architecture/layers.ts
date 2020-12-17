import * as cdk from "@aws-cdk/core";

import {DataInterface, ServiceInterface} from "./interfaces";


export abstract class PersistenceLayer extends cdk.Stack {

    dataInterface: DataInterface;

    protected constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.dataInterface = new DataInterface;
    }
}

export abstract class ServiceLayer extends cdk.Stack {

    serviceInterface: ServiceInterface;

    dataInterface: DataInterface;

    protected constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, props: cdk.StackProps) {
        super(scope, id, props);

        this.dataInterface = dataInterface;

        this.serviceInterface = new ServiceInterface;
    }
}

export abstract class PresentationLayer extends cdk.Stack {

    serviceInterface: ServiceInterface;

    protected constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, props);

        this.serviceInterface = serviceInterface;
    }
}