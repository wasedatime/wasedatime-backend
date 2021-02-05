import * as cdk from "@aws-cdk/core";

import {
    AbstractApiEndpoint,
    AbstractRestApiEndpoint,
    WasedaTimeRestApiEndpoint
} from "../constructs/business/api-endpoint";
import {DataEndpoint, ServiceEndpoint} from "../configs/common/registry";
import {ApiEndpoint, ApiServices} from "../configs/api/service";
import {BusinessLayer} from "../architecture/layers";
import {DataInterface} from "../architecture/interfaces";
import {AbstractAuthProvider, WasedaTimeUserAuth} from "../constructs/business/authentication";
import {WasedaTimeHostedZone} from "../constructs/common/hosted-zone";


export class WasedaTimeBusinessLayer extends BusinessLayer {

    apiEndpoints: { [name in ApiEndpoint]?: AbstractApiEndpoint } = {};

    authProvider: AbstractAuthProvider;

    constructor(scope: cdk.Construct, id: string, dataInterface: DataInterface, hostedZone: WasedaTimeHostedZone, props: cdk.StackProps) {
        super(scope, id, dataInterface, props);

        const authEndpoint = new WasedaTimeUserAuth(this, 'cognito-endpoint', hostedZone.zone);
        this.authProvider = authEndpoint;

        const mainApiEndpoint: AbstractRestApiEndpoint = new WasedaTimeRestApiEndpoint(this, 'rest-api-endpoint', {
            zone: hostedZone.zone,
            dataSources: {
                [ApiServices.SYLLABUS]: this.dataInterface.getEndpoint(DataEndpoint.SYLLABUS),
                [ApiServices.COURSE_REVIEW]: this.dataInterface.getEndpoint(DataEndpoint.COURSE_REVIEWS),
                [ApiServices.TIMETABLE]: this.dataInterface.getEndpoint(DataEndpoint.TIMETABLE)
            },
            authProvider: authEndpoint.pool.userPoolArn
        });
        this.apiEndpoints[ApiEndpoint.MAIN] = mainApiEndpoint;

        this.serviceInterface.setEndpoint(ServiceEndpoint.API_MAIN, mainApiEndpoint.getDomain());

        this.serviceInterface.setEndpoint(ServiceEndpoint.AUTH, authEndpoint.getDomain());
    }
}