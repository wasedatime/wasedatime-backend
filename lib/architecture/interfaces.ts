import { DataEndpoint, OperationEndpoint, ServiceEndpoint } from '../configs/common/registry';
import { Registry } from './protocols';

interface IInterface {
  protocol: Registry<unknown>;

  getEndpoint(name: number): any;

  setEndpoint(name: number, value: any): void;
}

export class DataInterface implements IInterface {
  protocol: Registry<DataEndpoint>;

  constructor() {
    this.protocol = new Map();
  }

  getEndpoint(name: DataEndpoint): any {
    const value = this.protocol.get(name);
    if (typeof value === 'undefined') {
      throw RangeError('Service not configured for this entry.');
    }
    return value;
  }

  setEndpoint(name: DataEndpoint, value: any) {
    this.protocol.set(name, value);
  }
}

export class ServiceInterface implements IInterface {
  protocol: Registry<ServiceEndpoint>;

  constructor() {
    this.protocol = new Map();
  }

  getEndpoint(name: ServiceEndpoint): any {
    const value = this.protocol.get(name);
    if (typeof value === 'undefined') {
      throw RangeError('Service not configured for this entry.');
    }
    return value;
  }

  setEndpoint(name: ServiceEndpoint, value: any) {
    this.protocol.set(name, value);
  }
}

export class OperationInterface implements IInterface {
  protocol: Registry<OperationEndpoint>;

  constructor() {
    this.protocol = new Map();
  }

  getEndpoint(name: OperationEndpoint): any {
    const value = this.protocol.get(name);
    if (typeof value === 'undefined') {
      throw RangeError('Service not configured for this entry.');
    }
    return value;
  }

  setEndpoint(name: OperationEndpoint, value: any): void {
    this.protocol.set(name, value);
    return;
  }
}
