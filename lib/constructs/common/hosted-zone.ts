import * as cdk from '@aws-cdk/core';
import {PublicHostedZone} from '@aws-cdk/aws-route53';

export class WasedaTimeHostedZone extends cdk.Stack {

    readonly zone: PublicHostedZone;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id);
        this.zone = new PublicHostedZone(this, 'hosted-zone', {
            zoneName: "wasedatime.com",
            comment: "The main hosted zone for WasedaTime."
        });
    }
}