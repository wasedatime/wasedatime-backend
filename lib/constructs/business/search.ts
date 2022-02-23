import { SecretValue } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as es from 'aws-cdk-lib/aws-elasticsearch';
import { Construct } from 'constructs';

export class ElasticsearchService extends Construct {
  readonly domain: es.Domain;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.domain = new es.Domain(this, 'es-domain', {
      capacity: {
        dataNodeInstanceType: 't3.small.elasticsearch',
      },
      domainName: 'wt-search',
      ebs: {
        volumeSize: 10,
        volumeType: ec2.EbsDeviceVolumeType.GP2,
      },
      enableVersionUpgrade: true,
      enforceHttps: true,
      fineGrainedAccessControl: {
        masterUserName: 'wasedatime',
        masterUserPassword: new SecretValue(process.env.WEBSITE_DEV_PASS),
      },
      logging: {}, // fixme
      encryptionAtRest: { enabled: true },
      nodeToNodeEncryption: true,
      tlsSecurityPolicy: es.TLSSecurityPolicy.TLS_1_2,
      useUnsignedBasicAuth: true,
      version: es.ElasticsearchVersion.V7_9,
    });
  }
}
