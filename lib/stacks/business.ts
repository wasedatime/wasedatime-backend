import * as cdk from "@aws-cdk/core";
import {IHostedZone} from "@aws-cdk/aws-route53";

import {
    AbstractApiEndpoint,
    AbstractGraphqlEndpoint,
    AbstractRestApiEndpoint,
    WasedaTimeGraphqlEndpoint,
    WasedaTimeRestApiEndpoint,
} from "../constructs/business/api-endpoint";
import {DataEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ApiServices} from "../configs/api-gateway/service";
import {BusinessLayer} from "../architecture/layers";
import {DataInterface} from "../architecture/interfaces";
import {AbstractAuthProvider, WasedaTimeUserAuth} from "../constructs/business/authentication";


export class WasedaTimeBusinessLayer extends BusinessLayer {

    apiEndpoints: { [name: string]: AbstractApiEndpoint } = {};

    authProvider: AbstractAuthProvider;

    constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, hostedZone: IHostedZone, props: cdk.StackProps) {
        super(scope, id, dataInterface, props);

        const authEndpoint = new WasedaTimeUserAuth(this, 'cognito-endpoint', hostedZone);
        this.authProvider = authEndpoint;

        const restApiEndpoint: AbstractRestApiEndpoint = new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
            zone: hostedZone,
            dataSources: {
                [ApiServices.SYLLABUS]: this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS),
                [ApiServices.COURSE_REVIEW]: this.dataInterface.getEndpoint(DataEndpoint.COURSE_REVIEWS),
                [ApiServices.TIMETABLE]: this.dataInterface.getEndpoint(DataEndpoint.TIMETABLE),
            },
            authProvider: authEndpoint.pool,
        });
        this.apiEndpoints["rest-api"] = restApiEndpoint;

        const graphqlApiEndpoint: AbstractGraphqlEndpoint = new WasedaTimeGraphqlEndpoint(this, 'graphql-api-endpoint', {
            zone: hostedZone,
            dataSources: {
                [ApiServices.SYLLABUS]: this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS),
            },
            authProvider: authEndpoint.pool,
        });
        this.apiEndpoints["graphql-api"] = graphqlApiEndpoint;

        this.serviceInterface.setEndpoint(ServiceEndpoint.API_REST, restApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.API_GRAPHQL, restApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.AUTH, authEndpoint.getDomain());
    }
}