import {DataEndpoint, ServiceEndpoint} from "../configs/registry";
import {DataRegistry, Registry, ServiceRegistry} from "./protocols";

export interface Discoverable {

    protocol: Registry;

    getEndpoint(name: number): string;

    setEndpoint(name: number, value: string): void;
}

export class DataInterface implements Discoverable {

    protocol: DataRegistry;

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

export class ServiceInterface implements Discoverable {

    protocol: ServiceRegistry;

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