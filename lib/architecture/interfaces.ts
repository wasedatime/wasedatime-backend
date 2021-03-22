import {DataEndpoint, OperationEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {Protocol, Registry} from "./protocols";


interface IInterface {

    protocol: Protocol;

    getEndpoint(name: number): string;

    setEndpoint(name: number, value: string): void;
}

export class DataInterface implements IInterface {

    protocol: Registry<DataEndpoint>;

    constructor() {
        this.protocol = new Map<DataEndpoint, string>();
    }

    getEndpoint(name: DataEndpoint): string {
        let value = this.protocol.get(name);
        if (typeof value === "undefined") {
            throw RangeError("Service not configured for this entry.");
        }
        return value;
    }

    setEndpoint(name: DataEndpoint, value: string): void {
        this.protocol.set(name, value);
        return;
    }
}

export class ServiceInterface implements IInterface {

    protocol: Registry<ServiceEndpoint>;

    constructor() {
        this.protocol = new Map<ServiceEndpoint, string>();
    }

    getEndpoint(name: ServiceEndpoint): string {
        const value = this.protocol.get(name);
        if (typeof value === "undefined") {
            throw RangeError("Service not configured for this entry.");
        }
        return value;
    }

    setEndpoint(name: ServiceEndpoint, value: string): void {
        this.protocol.set(name, value);
        return;
    }
}

export class OperationInterface implements IInterface {

    protocol: Registry<OperationEndpoint>;

    constructor() {
        this.protocol = new Map<OperationEndpoint, string>();
    }

    getEndpoint(name: OperationEndpoint): any {
        const value = this.protocol.get(name);
        if (typeof value === "undefined") {
            throw RangeError("Service not configured for this entry.");
        }
        return value;
    }

    setEndpoint(name: OperationEndpoint, value: any): void {
        this.protocol.set(name, value);
        return;
    }
}