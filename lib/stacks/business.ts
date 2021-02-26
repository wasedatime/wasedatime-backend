import * as cdk from "@aws-cdk/core";
import {IHostedZone} from "@aws-cdk/aws-route53";

import {
    AbstractApiEndpoint,
    AbstractRestApiEndpoint,
    WasedaTimeRestApiEndpoint,
} from "../constructs/business/api-endpoint";
import {DataEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ApiEndpoint} from "../configs/api/service";
import {BusinessLayer} from "../architecture/layers";
import {DataInterface} from "../architecture/interfaces";
import {AbstractAuthProvider, WasedaTimeUserAuth} from "../constructs/business/authentication";


export class WasedaTimeBusinessLayer extends BusinessLayer {

    apiEndpoints: { [name in ApiEndpoint]?: AbstractApiEndpoint } = {};

    authProvider: AbstractAuthProvider;

    constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, hostedZone: IHostedZone, props: cdk.StackProps) {
        super(scope, id, dataInterface, props);

        const authEndpoint = new WasedaTimeUserAuth(this, 'cognito-endpoint', hostedZone);
        this.authProvider = authEndpoint;

        const mainApiEndpoint: AbstractRestApiEndpoint = new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
            zone: hostedZone,
            authProvider: authEndpoint.pool.userPoolArn,
        });
        this.apiEndpoints[ApiEndpoint.MAIN] = mainApiEndpoint;

        mainApiEndpoint.addService("syllabus", this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS))
            .addService("course-reviews", this.dataInterface.getEndpoint(DataEndpoint.COURSE_REVIEWS), true)
            .addService("feeds")
            .addService("career")
            .addService("timetable", this.dataInterface.getEndpoint(DataEndpoint.TIMETABLE), true);
        mainApiEndpoint.deploy();

        this.serviceInterface.setEndpoint(ServiceEndpoint.API_MAIN, mainApiEndpoint.getDomain());
        this.serviceInterface.setEndpoint(ServiceEndpoint.AUTH, authEndpoint.getDomain());
    }
}