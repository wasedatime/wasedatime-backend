import {BasicAuth, CustomRule, RedirectStatus} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";

require('dotenv').config()

const wwwRedirect = new CustomRule({
    source: "https://www.wasedatime.com",
    target: "https://wasedatime.com",
    status: RedirectStatus.PERMANENT_REDIRECT
});

const sitemapRewrite = new CustomRule({
    source: "/sitemap.xml",
    target: "/sitemap.xml",
    status: RedirectStatus.REWRITE
});

const robotRewrite = new CustomRule({
    source: "/robots.txt",
    target: "/robots.txt",
    status: RedirectStatus.REWRITE
});

export const webappSiteRules = [wwwRedirect, sitemapRewrite, robotRewrite, CustomRule.SINGLE_PAGE_APPLICATION_REDIRECT];

export const developerAuth = BasicAuth.fromCredentials(
    "wasedatime", new SecretValue(process.env.WEBSITE_DEV_PASS)
)