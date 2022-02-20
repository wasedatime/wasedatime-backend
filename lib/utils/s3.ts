import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { AwsServicePrincipal } from '../configs/common/aws';

export function allowApiGatewayPolicy(bucket: s3.Bucket): void {
  const apiGatewayListBucket: iam.PolicyStatement = new iam.PolicyStatement({
    sid: 'Stmt1603867916417',
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
    actions: ['s3:ListBucket'],
    resources: [bucket.bucketArn],
  });
  const apiGatewayGetObject: iam.PolicyStatement = new iam.PolicyStatement({
    sid: 'Stmt1603867944000',
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
    actions: ['s3:GetObject', 's3:GetObjectVersion'],
    resources: [`${ bucket.bucketArn }/*`],
  });
  bucket.addToResourcePolicy(apiGatewayListBucket);
  bucket.addToResourcePolicy(apiGatewayGetObject);
}

export function allowLambdaPolicy(bucket: s3.Bucket): void {
  const lambdaListBucket: iam.PolicyStatement = new iam.PolicyStatement({
    sid: 'Stmt1873873416417',
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA)],
    actions: ['s3:ListBucket'],
    resources: [bucket.bucketArn],
  });
  const lambdaAccessObject: iam.PolicyStatement = new iam.PolicyStatement({
    sid: 'Stmt1873873416417',
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal(AwsServicePrincipal.LAMBDA)],
    actions: [
      's3:PutObject',
      's3:PutObjectAcl',
      's3:GetObject',
      's3:GetObjectAcl',
      's3:DeleteObject',
      's3:GetObjectVersion',
    ],
    resources: [`${ bucket.bucketArn }/*`],
  });
  bucket.addToResourcePolicy(lambdaListBucket);
  bucket.addToResourcePolicy(lambdaAccessObject);
}
