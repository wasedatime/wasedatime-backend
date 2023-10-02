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
    'echo "github.com ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCj7ndNxQowgcQnjshcLrqPEiiphnt+VTTvDP6mHBL9j1aNUkY4Ue1gvwnGLVlOhGeYrnZaMgRK6+PKCUXaDbC7qtbW8gIkhL7aGCsOr/C56SJMy/BCZfxd1nWzAOxSDPgVsmerOBYfNqltV9/hWCqBywINIR+5dIg6JTJ72pcEpEjcYgXkE2YEFXV1JHnsKgbLWNlhScqb2UmyRkQyytRLtL+38TGxkxCflmO+5Z8CSSNY7GidjMIZ7Q4zMjA2n1nGrlTDkzwDCsw+wqFPGQA179cnfGWOWRVruj16z6XyvxvjJwbz0wQZ75XK5tKSb7FNyeIEs4TT4jk+S4dhPeAUC5y+bDYirYgM4GC7uEnztnZyaVWQ7B381AK4Qdrwt51ZqExKbQpTUNn+EjqoTwvqNj4kqx5QUCI0ThS/YkOxJCXmPUWZbhjpCg56i+2aB6CmK2JGhn57K5mj0MNdBXA4/WnwH6XoPWJzK5Nyu2zB3nAZp+S5hpQs+p1vN1/wsjk=" >> ~/.ssh/known_hosts',
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
        appRoot: `apps/${name}`,
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
        appRoot: `apps/${name}`,
      },
    ],
  });
