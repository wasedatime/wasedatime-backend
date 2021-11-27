import * as cdk from '@aws-cdk/core';
import {Duration} from '@aws-cdk/core';
import {CnameRecord, MxRecord, PublicHostedZone, TxtRecord} from '@aws-cdk/aws-route53';
import {DOC_DOMAIN, EMAIL_TXT, GITHUB_PAGES, MX_VALUES, ROOT_DOMAIN} from "../../configs/route53/domain";

export class WasedaTimeHostedZone extends cdk.Stack {
    readonly zone: PublicHostedZone;

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.zone = new PublicHostedZone(this, 'hosted-zone', {
            zoneName: ROOT_DOMAIN,
            comment: "The main hosted zone for WasedaTime.",
        });

        new CnameRecord(this, 'docs', {
            zone: this.zone,
            domainName: GITHUB_PAGES,
            recordName: DOC_DOMAIN,
            ttl: Duration.seconds(300),
            comment: "DNS Record for API Documentation hosting on Github Pages",
        });

        new MxRecord(this, 'mx-record', {
            zone: this.zone,
            recordName: ROOT_DOMAIN,
            values: MX_VALUES,
            ttl: Duration.seconds(300),
            comment: "Forward email",
        });

        new TxtRecord(this, 'email-txt', {
            zone: this.zone,
            recordName: ROOT_DOMAIN,
            values: EMAIL_TXT,
            ttl: Duration.seconds(300),
            comment: "Forward email",
        });
    }
}
