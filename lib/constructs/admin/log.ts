import '@aws-cdk/aws-cloudtrail';
import * as cdk from '@aws-cdk/core';
import {Trail} from "@aws-cdk/aws-cloudtrail";


export class GlobalTrailLogs extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        new Trail(this, 'trail', {
            trailName: "global-management-trail",
        });
    }
}