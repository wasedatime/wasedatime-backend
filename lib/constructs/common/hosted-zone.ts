import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { DOC_DOMAIN, EMAIL_TXT, GITHUB_PAGES, MX_VALUES, ROOT_DOMAIN } from '../../configs/route53/domain';

export class WasedaTimeHostedZone extends Stack {
  readonly zone: route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.zone = new route53.PublicHostedZone(this, 'hosted-zone', {
      zoneName: ROOT_DOMAIN,
      comment: 'The main hosted zone for WasedaTime.',
    });

    new route53.CnameRecord(this, 'docs', {
      zone: this.zone,
      domainName: GITHUB_PAGES,
      recordName: DOC_DOMAIN,
      ttl: Duration.seconds(300),
      comment: 'DNS Record for API Documentation hosting on Github Pages',
    });

    new route53.MxRecord(this, 'mx-record', {
      zone: this.zone,
      recordName: ROOT_DOMAIN,
      values: MX_VALUES,
      ttl: Duration.seconds(300),
      comment: 'Forward email',
    });

    new route53.TxtRecord(this, 'email-txt', {
      zone: this.zone,
      recordName: ROOT_DOMAIN,
      values: EMAIL_TXT,
      ttl: Duration.seconds(300),
      comment: 'Forward email',
    });
  }
}
