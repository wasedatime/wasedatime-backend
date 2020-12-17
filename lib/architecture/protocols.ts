import {DataEndpoint, ServiceEndpoint} from "../configs/registry";
import {Method} from "@aws-cdk/aws-apigateway";
import {HttpMethod} from "@aws-cdk/aws-apigatewayv2";


export interface Registry {
}

export interface DataRegistry extends Map<DataEndpoint, string>, Registry {
}

export interface ServiceRegistry extends Map<ServiceEndpoint, string>, Registry {
}

export interface MethodRegistry extends Map<HttpMethod, Method>, Registry {
}