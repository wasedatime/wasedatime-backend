import * as cdk from '@aws-cdk/core';
import {
    AllowedMethods,
    BehaviorOptions,
    CachedMethods,
    CachePolicy,
    Distribution,
    OriginRequestPolicy
} from '@aws-cdk/aws-cloudfront';
import {ServiceEndpoint} from "../../configs/common/registry";
import {HttpOrigin} from "@aws-cdk/aws-cloudfront-origins";
import {API_DOMAIN} from "../../configs/route53/domain";


export class WasedaTimeApiDistribution extends cdk.Construct {

    readonly distribution: Distribution;

    constructor(scope: cdk.Construct, id: string, apiDomains: { [origin in ServiceEndpoint]: string }) {
        super(scope, id);

        // todo specify details
        const cacheHttpApiGw: BehaviorOptions = {
            origin: new HttpOrigin(apiDomains[ServiceEndpoint.API_MAIN]),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_OPTIMIZED,
            cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress: true,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER
        };
        // const cacheGraphqlApi: BehaviorOptions = {
        //     origin: new HttpOrigin(apiDomains[ServiceEndpoint.API_GRAPHQL]),
        //         allowedMethods: AllowedMethods.ALLOW_ALL,
        //         cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        //         cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        //         compress: true,
        //         originRequestPolicy: OriginRequestPolicy.ALL_VIEWER
        // }

        // todo specify details
        this.distribution = new Distribution(this, 'distribution', {
            comment: "Proxy/Gateway router for API Gateway and AppSync GraphQL API.",
            defaultBehavior: cacheHttpApiGw,
            additionalBehaviors: {},
            domainNames: [API_DOMAIN]
        });
    }

}