import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { microAppCorsHeader, securityHeaders } from './website';

export const BIT_TOKEN = process.env.BIT_TOKEN!;
export const FEEDS_DEPLOY_KEY = process.env.DEPLOY_KEY!;
export const MASTER_VITE_GA_ID = process.env.MASTER_VITE_GA_ID!;
export const DEV_VITE_GA_ID = process.env.DEV_VITE_GA_ID!;

const preBuild = {
  commands: ['npm install -g pnpm', 'pnpm install --filter .'],
};

const preBuildForFeeds = {
  commands: [
    'eval $(ssh-agent -s)',
    'ssh-add <(echo "$DEPLOY_KEY" | base64 --decode)',
    'git submodule init',
    'git submodule update --remote',
    'yum -y install make nasm autoconf automake libtool dpkg pkgconfig libpng libpng-dev g++',
    'npm install -g pnpm',
    'pnpm install --filter .',
  ],
};

const prodBuild = {
  commands: ['pnpm run build'],
};

const devBuild = {
  commands: ['export PREFIX="${AWS_BRANCH//[\\/_]/-}"', 'pnpm run build-dev'],
};

const artifacts = {
  // IMPORTANT - Please verify your build output directory
  baseDirectory: '/dist',
  files: ['**/*'],
};

const cache = { paths: ['node_modules/**/*', '~/.pnpm-store'] };

export const microAppBuildSpec = (name: string) =>
  codebuild.BuildSpec.fromObject({
    version: 1,
    applications: [
      {
        frontend: {
          phases: {
            preBuild: name == 'feeds' ? preBuildForFeeds : preBuild,
            build: prodBuild,
          },
          artifacts: artifacts,
          cache: cache,
          customHeaders: [
            {
              pattern: '**/*',
              headers: securityHeaders.concat(microAppCorsHeader),
            },
          ],
        },
        appRoot: name,
      },
    ],
  });

export const microAppDevBuildSpec = (name: string) =>
  codebuild.BuildSpec.fromObject({
    version: 1,
    applications: [
      {
        frontend: {
          phases: {
            preBuild: name == 'feeds' ? preBuildForFeeds : preBuild,
            build: devBuild,
          },
          artifacts: artifacts,
          cache: cache,
          customHeaders: [
            {
              pattern: '**/*',
              headers: microAppCorsHeader,
            },
          ],
        },
        appRoot: name,
      },
    ],
  });
