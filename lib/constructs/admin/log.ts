import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

export class GlobalTrailLogs extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    new cloudtrail.Trail(this, 'trail', {
      trailName: 'global-management-trail',
    });
  }
}
