import {BasicAuth, CustomRule, RedirectStatus} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";

const wwwRedirect: CustomRule = new CustomRule({
    source: "https://www.wasedatime.com",
    target: "https://wasedatime.com",
    status: RedirectStatus.PERMANENT_REDIRECT,
});

const sitemapRewrite: CustomRule = new CustomRule({
    source: "/sitemap.xml",
    target: "/sitemap.xml",
    status: RedirectStatus.REWRITE,
});

const robotRewrite: CustomRule = new CustomRule({
    source: "/robots.txt",
    target: "/robots.txt",
    status: RedirectStatus.REWRITE,
});

const spaRewrite: CustomRule = new CustomRule({
    source: "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>",
    target: "/index.html",
    status: RedirectStatus.REWRITE,
});

export const webappSiteRules: CustomRule[] = [wwwRedirect, sitemapRewrite, robotRewrite, spaRewrite];

export const developerAuth: BasicAuth = BasicAuth.fromCredentials(
    "wasedatime", new SecretValue(process.env.WEBSITE_DEV_PASS),
);

export const securityHeaders = [
    {
        "key": "Strict-Transport-Security",
        "value": "max-age=15552000; includeSubDomains",
    },
    {
        "key": "X-Frame-Options",
        "value": "SAMEORIGIN",
    },
    {
        "key": "X-XSS-Protection",
        "value": "1; mode=block",
    },
    {
        "key": "X-Content-Type-Options",
        "value": "nosniff",
    },
    {
        "key": "Content-Security-Policy",
        "value": "default-src 'self' 'unsafe-inline' https: data:;",
    },
    {
        "key": "X-Content-Security-Policy",
        "value": "default-src 'self' 'unsafe-inline' https: data:;",
    },
    {
        "key": "X-WebKit-CSP",
        "value": "default-src 'self' 'unsafe-inline' https: data:;",
    },
    {
        "key": "X-Download-Options",
        "value": "noopen",
    },
    {
        "key": "X-DNS-Prefetch-Control",
        "value": "off",
    },
];

export const microAppCorsHeader = [
    {
        key: "Access-Control-Allow-Origin",
        value: "*",
    },
    {
        key: "Access-Control-Allow-Methods",
        value: "GET, HEAD, OPTIONS",
    },
];
