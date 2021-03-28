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
            authProvider: authEndpoint.pool,
        });
        this.apiEndpoints["rest-api"] = restApiEndpoint;

        const graphqlApiEndpoint: AbstractGraphqlEndpoint = new WasedaTimeGraphqlEndpoint(this, 'graphql-api-endpoint', {
            zone: hostedZone,
            authProvider: authEndpoint.pool,
        });
        this.apiEndpoints["graphql-api"] = graphqlApiEndpoint;

        graphqlApiEndpoint.addService("course", this.dataInterface.getEndpoint(DataEndpoint.COURSE));

        restApiEndpoint.addService("syllabus", this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS))
            .addService("course-reviews", this.dataInterface.getEndpoint(DataEndpoint.COURSE_REVIEWS), true)
            .addService("feeds")
            .addService("career")
            .addService("timetable", this.dataInterface.getEndpoint(DataEndpoint.TIMETABLE), true)
            .addService("graphql", graphqlApiEndpoint.apiEndpoint.graphqlUrl);
        restApiEndpoint.deploy();

        this.serviceInterface.setEndpoint(ServiceEndpoint.API_REST, restApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.API_GRAPHQL, graphqlApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.AUTH, authEndpoint.getDomain());
    }
}