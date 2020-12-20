import {BlockPublicAccess, Bucket} from "@aws-cdk/aws-s3";
import {Effect, PolicyStatement, ServicePrincipal} from "@aws-cdk/aws-iam";
import {AwsServicePrincipal} from "../aws";


export const publicAccess: BlockPublicAccess = new BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false
});

export function allowApiGatewayPolicy(bucket: Bucket): void {
    const apiGatewayListBucket: PolicyStatement = new PolicyStatement({
        sid: "Stmt1603867916417",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
        actions: ["s3:ListBucket"],
        resources: [bucket.bucketArn]
    });
    const apiGatewayGetObject: PolicyStatement = new PolicyStatement({
        sid: "Stmt1603867944000",
        effect: Effect.ALLOW,
        principals: [new ServicePrincipal(AwsServicePrincipal.API_GATEWAY)],
        actions: ["s3:GetObject", "s3:GetObjectVersion"],
        resources: [`${bucket.bucketArn}/*`]
    });
    bucket.addToResourcePolicy(apiGatewayListBucket);
    bucket.addToResourcePolicy(apiGatewayGetObject);
}