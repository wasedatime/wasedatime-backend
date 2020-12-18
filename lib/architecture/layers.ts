import * as cdk from "@aws-cdk/core";

import {DataInterface, OperationInterface, ServiceInterface} from "./interfaces";


export abstract class PersistenceLayer extends cdk.Stack {

    dataInterface: DataInterface;

    operationInterface: OperationInterface;

    protected constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.dataInterface = new DataInterface;

        this.operationInterface = new OperationInterface;
    }
}

export abstract class BusinessLayer extends cdk.Stack {

    serviceInterface: ServiceInterface;

    dataInterface: DataInterface;

    operationInterface: OperationInterface;

    protected constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, props: cdk.StackProps) {
        super(scope, id, props);

        this.dataInterface = dataInterface;

        this.serviceInterface = new ServiceInterface;

        this.operationInterface = new OperationInterface;
    }
}

export abstract class PresentationLayer extends cdk.Stack {

    serviceInterface: ServiceInterface;

    operationInterface: OperationInterface;

    protected constructor(scope: cdk.Construct, id: string, serviceInterface: ServiceInterface, props?: cdk.StackProps) {
        super(scope, id, props);

        this.serviceInterface = serviceInterface;

        this.operationInterface = new OperationInterface;
    }
}

export abstract class AdminLayer extends cdk.Stack {

    operationInterface: OperationInterface;

    protected constructor(scope: cdk.Construct, id: string, operationInterface: OperationInterface, props?: cdk.StackProps) {
        super(scope, id, props);

        this.operationInterface = operationInterface;
    }
}