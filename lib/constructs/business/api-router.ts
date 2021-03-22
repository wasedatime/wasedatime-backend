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
import {Certificate} from "@aws-cdk/aws-certificatemanager";
import {ARecord, IHostedZone, RecordTarget} from "@aws-cdk/aws-route53";
import {CloudFrontTarget} from "@aws-cdk/aws-route53-targets";

import {API_DOMAIN} from "../../configs/route53/domain";
import {API_CERT_ARN} from "../../configs/common/arn";


export class WasedaTimeApiRouter extends cdk.Construct {

    readonly distribution: Distribution;

    readonly domain: string;

    constructor(scope: cdk.Construct, id: string, apiDomains: { [name: string]: string }, zone: IHostedZone) {
        super(scope, id);

        const routeRestApiGw: BehaviorOptions = {
            origin: new HttpOrigin(apiDomains.rest),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_DISABLED,
            cachedMethods: CachedMethods.CACHE_GET_HEAD,
            compress: true,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        };
        const routeGraphqlApi: BehaviorOptions = {
            origin: new HttpOrigin(apiDomains.graphql),
            allowedMethods: AllowedMethods.ALLOW_ALL,
            cachePolicy: CachePolicy.CACHING_DISABLED,
            cachedMethods: CachedMethods.CACHE_GET_HEAD,
            compress: true,
            originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
            viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        };

        const cert = Certificate.fromCertificateArn(this, 'api-cert', API_CERT_ARN);

        this.distribution = new Distribution(this, 'distribution', {
            comment: "Proxy/Gateway router for API Gateway and AppSync GraphQL API.",
            defaultBehavior: routeRestApiGw,
            additionalBehaviors: {
                "/graphql": routeGraphqlApi,
            },
            certificate: cert,
            domainNames: [API_DOMAIN],
        });

        new ARecord(this, 'alias-record', {
            zone: zone,
            target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
            recordName: API_DOMAIN,
        });

        this.domain = this.distribution.domainName;
    }
}