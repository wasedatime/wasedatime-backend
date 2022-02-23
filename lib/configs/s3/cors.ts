import * as s3 from 'aws-cdk-lib/aws-s3';

export const prodCorsRule: s3.CorsRule[] = [{
  allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
  allowedOrigins: ['https://wasedatime.com', 'https://*.wasedatime.com'],
}];
