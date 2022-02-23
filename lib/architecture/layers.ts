import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataInterface, OperationInterface, ServiceInterface } from './interfaces';

export abstract class PersistenceLayer extends Stack {
  dataInterface: DataInterface;
  operationInterface: OperationInterface;

  protected constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.dataInterface = new DataInterface;
    this.operationInterface = new OperationInterface;
  }
}

export abstract class BusinessLayer extends Stack {
  serviceInterface: ServiceInterface;
  dataInterface: DataInterface;
  operationInterface: OperationInterface;

  protected constructor(scope: Construct, id: string, dataInterface: DataInterface, props: StackProps) {
    super(scope, id, props);

    this.dataInterface = dataInterface;
    this.serviceInterface = new ServiceInterface;
    this.operationInterface = new OperationInterface;
  }
}

export abstract class PresentationLayer extends Stack {
  serviceInterface: ServiceInterface;
  operationInterface: OperationInterface;

  protected constructor(scope: Construct, id: string, serviceInterface: ServiceInterface, props?: StackProps) {
    super(scope, id, props);

    this.serviceInterface = serviceInterface;
    this.operationInterface = new OperationInterface;
  }
}

export abstract class AdminLayer extends Stack {
  operationInterface: OperationInterface;

  protected constructor(scope: Construct, id: string, operationInterface: OperationInterface, props?: StackProps) {
    super(scope, id, props);

    this.operationInterface = operationInterface;
  }
}
