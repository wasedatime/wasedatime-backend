import * as s3 from 'aws-cdk-lib/aws-s3';

export const publicAccess = new s3.BlockPublicAccess({
  blockPublicAcls: false,
  blockPublicPolicy: false,
  ignorePublicAcls: false,
  restrictPublicBuckets: false,
});
