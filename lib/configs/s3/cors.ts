import {CorsRule, HttpMethods} from "@aws-cdk/aws-s3";


export const prodCorsRule: CorsRule[] = [{
    allowedMethods: [HttpMethods.GET,],
    allowedOrigins: ["https://wasedatime.com", "https://*.wasedatime.com"]
}];