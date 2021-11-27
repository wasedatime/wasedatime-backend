import {Bucket} from "@aws-cdk/aws-s3";
import {Effect, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {AwsServicePrincipal} from "../configs/common/aws";

export function allowApiGatewayPolicy(bucket: Bucket): void {
    const apiGatewayListBucket: PolicyStatement = new PolicyStatement({
        sid: "Stmt1603867916417",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn],
    });
    const apiGatewayGetObject: PolicyStatement = new PolicyStatement({
        sid: "Stmt1603867944000",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [`${bucket.bucketArn}/*`],
    });
    bucket.addToResourcePolicy(apiGatewayListBucket);
    bucket.addToResourcePolicy(apiGatewayGetObject);
}

export function allowLambdaPolicy(bucket: Bucket): void {
    const lambdaListBucket: PolicyStatement = new PolicyStatement({
        sid: "Stmt1873873416417",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.LAMBDA)],
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn],
    });
    const lambdaAccessObject: PolicyStatement = new PolicyStatement({
        sid: "Stmt1873873416417",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.LAMBDA)],
        actions: [
            "s3:PutObject",
            "s3:PutObjectAcl",
            "s3:GetObject",
            "s3:GetObjectAcl",
            "s3:DeleteObject",
            "s3:GetObjectVersion",
        ],
        resources: [`${bucket.bucketArn}/*`],
    });
    bucket.addToResourcePolicy(lambdaListBucket);
    bucket.addToResourcePolicy(lambdaAccessObject);
}
