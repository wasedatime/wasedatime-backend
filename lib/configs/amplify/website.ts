import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { SecretValue } from 'aws-cdk-lib';

const wwwRedirect = new amplify.CustomRule({
  source: 'https://www.wasedatime.com',
  target: 'https://wasedatime.com',
  status: amplify.RedirectStatus.PERMANENT_REDIRECT,
});

const sitemapRewrite = new amplify.CustomRule({
  source: '/sitemap.xml',
  target: '/sitemap.xml',
  status: amplify.RedirectStatus.REWRITE,
});

const robotRewrite = new amplify.CustomRule({
  source: '/robots.txt',
  target: '/robots.txt',
  status: amplify.RedirectStatus.REWRITE,
});

const spaRewrite = new amplify.CustomRule({
  source: '</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>',
  target: '/index.html',
  status: amplify.RedirectStatus.REWRITE,
});

export const webappSiteRules = [wwwRedirect, sitemapRewrite, robotRewrite, spaRewrite];

export const developerAuth = amplify.BasicAuth.fromCredentials(
  'wasedatime', new SecretValue(process.env.WEBSITE_DEV_PASS),
);

export const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=15552000; includeSubDomains',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Content-Security-Policy',
    value: 'default-src \'self\' \'unsafe-inline\' https: data:;',
  },
  {
    key: 'X-Content-Security-Policy',
    value: 'default-src \'self\' \'unsafe-inline\' https: data:;',
  },
  {
    key: 'X-WebKit-CSP',
    value: 'default-src \'self\' \'unsafe-inline\' https: data:;',
  },
  {
    key: 'X-Download-Options',
    value: 'noopen',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
];

export const microAppCorsHeader = [
  {
    key: 'Access-Control-Allow-Origin',
    value: '*',
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, HEAD, OPTIONS',
  },
];
