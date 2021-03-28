import * as cdk from '@aws-cdk/core';
import {SecretValue} from '@aws-cdk/core';
import {Domain, ElasticsearchVersion, TLSSecurityPolicy} from "@aws-cdk/aws-elasticsearch";
import {EbsDeviceVolumeType} from "@aws-cdk/aws-ec2";


export class ElasticsearchService extends cdk.Construct {

    readonly domain: Domain;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        this.domain = new Domain(this, 'es-domain', {
            capacity: {
                dataNodeInstanceType: 't3.small.elasticsearch'
            },
            domainName: "wt-search",
            ebs: {
                volumeSize: 10,
                volumeType: EbsDeviceVolumeType.GP2
            },
            enableVersionUpgrade: true,
            enforceHttps: true,
            fineGrainedAccessControl: {
                masterUserName: 'wasedatime',
                masterUserPassword: new SecretValue(process.env.WEBSITE_DEV_PASS)
            },
            logging: {}, // fixme
            encryptionAtRest: {enabled: true},
            nodeToNodeEncryption: true,
            tlsSecurityPolicy: TLSSecurityPolicy.TLS_1_2,
            useUnsignedBasicAuth: true,
            version: ElasticsearchVersion.V7_9
        });
    }
}