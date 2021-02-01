import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';

class WasedaTimeHostedZone extends cdk.Construct {

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);
        new route53.PublicHostedZone(this, 'hosted-zone', {
            zoneName: "wasedatime.com",
            comment: "The main hosted zone for WasedaTime."
        });

        //todo add records
    }
}