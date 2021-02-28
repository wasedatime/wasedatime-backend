import * as cdk from '@aws-cdk/core';
import {
    AllowedMethods,
    BehaviorOptions,
    CachedMethods,
    CachePolicy,
    Distribution,
    OriginRequestPolicy,
    ViewerProtocolPolicy,
} from '@aws-cdk/aws-cloudfront';
import {HttpOrigin} from "@aws-cdk/aws-cloudfront-origins";
import {API_DOMAIN} from "../../configs/route53/domain";


export class WasedaTimeApiDistribution extends cdk.Construct {

    readonly distribution: Distribution;

    constructor(scope: cdk.Construct, id: string, apiDomains: { [name: string]: string }) {
        super(scope, id);

        const cacheRestApiGw: BehaviorOptions = {
            origin: new HttpOrigin(apiDomains.rest),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            cachedMethods: CachedMethods.CACHE_GET_HEAD,
            compress: true,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        };
        const cacheGraphqlApi: BehaviorOptions = {
            origin: new HttpOrigin(apiDomains.graphql),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            cachedMethods: CachedMethods.CACHE_GET_HEAD,
            compress: true,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        };

        this.distribution = new Distribution(this, 'distribution', {
            comment: "Proxy/Gateway router for API Gateway and AppSync GraphQL API.",
            defaultBehavior: cacheRestApiGw,
            additionalBehaviors: {
                "graphql": cacheGraphqlApi,
            },
            domainNames: [API_DOMAIN],
        });
    }

}