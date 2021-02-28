import {BlockPublicAccess} from "@aws-cdk/aws-s3";


export const publicAccess: BlockPublicAccess = new BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});