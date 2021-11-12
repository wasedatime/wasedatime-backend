import {BuildSpec} from "@aws-cdk/aws-codebuild/lib/build-spec";
import {microAppCorsHeader, securityHeaders} from "./website";


export const bitToken = process.env.BIT_TOKEN!;
export const feedsDeployKey = process.env.FEEDS_DEPLOY_PRIVATE_KEY!;

const preBuild = {
    commands: [
        "npm install -g pnpm",
        "pnpm install --filter .",
    ],
};

const preBuildForFeeds = {
    commands: [
        "eval $(ssh-agent -s)",
        "ssh-add <(echo \"$FEEDS_DEPLOY_PRIVATE_KEY\" | base64 --decode)",
        "git submodule init",
        "git submodule update --remote",
        "yum -y install make nasm autoconf automake libtool dpkg pkgconfig libpng libpng-dev g++",
        "npm install -g pnpm",
        "pnpm install --filter .",
    ],
};

const prodBuild = {
    commands: ["pnpm run build"],
};

const devBuild = {
    commands: [
        "export PREFIX=\"${AWS_BRANCH//[\\/_]/-}\"",
        "pnpm run build-dev",
    ],
};

const artifacts = {
    // IMPORTANT - Please verify your build output directory
    baseDirectory: "/dist",
    files: ["**/*"],
};

const cache = {paths: ["node_modules/**/*", "~/.pnpm-store"]};

export const microAppBuildSpec = (name: string): BuildSpec => BuildSpec.fromObject({
    version: 1,
    applications: [
        {
            frontend: {
                phases: {
                    preBuild: name == "feeds" ? preBuildForFeeds : preBuild,
                    build: prodBuild,
                },
                artifacts: artifacts,
                cache: cache,
                customHeaders: [
                    {
                        pattern: "**/*",
                        headers: securityHeaders.concat(microAppCorsHeader),
                    },
                ],
            },
            appRoot: name,
        },
    ],
});

export const microAppDevBuildSpec = (name: string): BuildSpec => BuildSpec.fromObject({
    version: 1,
    applications: [
        {
            frontend: {
                phases: {
                    preBuild: name == "feeds" ? preBuildForFeeds : preBuild,
                    build: devBuild,
                },
                artifacts: artifacts,
                cache: cache,
                customHeaders: [
                    {
                        pattern: "**/*",
                        headers: microAppCorsHeader,
                    },
                ],
            },
            appRoot: name,
        },
    ],
});
