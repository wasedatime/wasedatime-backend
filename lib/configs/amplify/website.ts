import {BasicAuth, CustomRule, RedirectStatus} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";

require('dotenv').config();


export const WEBAPP_DOMAIN: string = "wasedatime.com";

const wwwRedirect: CustomRule = new CustomRule({
    source: "https://www.wasedatime.com",
    target: "https://wasedatime.com",
    status: RedirectStatus.PERMANENT_REDIRECT
});

const sitemapRewrite: CustomRule = new CustomRule({
    source: "/sitemap.xml",
    target: "/sitemap.xml",
    status: RedirectStatus.REWRITE
});

const robotRewrite: CustomRule = new CustomRule({
    source: "/robots.txt",
    target: "/robots.txt",
    status: RedirectStatus.REWRITE
});

const spaRewrite: CustomRule = new CustomRule({
    source: "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>",
    target: "/index.html",
    status: RedirectStatus.REWRITE
});

export const webappSiteRules: CustomRule[] = [
    wwwRedirect, sitemapRewrite, robotRewrite, spaRewrite
];

export const developerAuth: BasicAuth = BasicAuth.fromCredentials(
    "wasedatime", new SecretValue(process.env.WEBSITE_DEV_PASS)
);