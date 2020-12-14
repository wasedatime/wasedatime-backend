import {BlockPublicAccess, CorsRule, HttpMethods} from "@aws-cdk/aws-s3";

export const publicAccess: BlockPublicAccess = new BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false
});

export const prodCorsRule: CorsRule[] = [{
    allowedMethods: [HttpMethods.GET,],
    allowedOrigins: ["https://wasedatime.com", "https://*.wasedatime.com"]
}];