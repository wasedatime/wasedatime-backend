import {BuildSpec} from "@aws-cdk/aws-codebuild/lib/build-spec";
import {microAppCorsHeader, securityHeaders} from "./website";


const preBuild = {
    commands: [
        "npm config set @bit:registry https://node.bit.dev",
        `npm config set //node.bit.dev/:_authToken ${process.env.BIT_TOKEN}`,
        "npm ci",
    ],
};

const prodBuild = {
    commands: ["npm run build"],
};

const devBuild = {
    commands: [
        "export PREFIX=\"${AWS_BRANCH//[\\/_]/-}\"",
        "npm run build-dev",
    ],
};

const artifacts = {
    // IMPORTANT - Please verify your build output directory
    baseDirectory: "/dist",
    files: ["**/*"],
};

const cache = {paths: ["node_modules/**/*"]};

export const rootAppBuildSpec = BuildSpec.fromObject({
    version: 1,
    applications: [
        {
            frontend: {
                phases: {
                    preBuild: preBuild,
                    build: prodBuild,
                },
                artifacts: artifacts,
                cache: cache,
                customHeaders: securityHeaders,
            },
            appRoot: "root",
        },
    ],
});

export const rootAppDevBuildSpec = BuildSpec.fromObject({
    version: 1,
    applications: [
        {
            frontend: {
                phases: {
                    preBuild: preBuild,
                    build: devBuild,
                },
                artifacts: artifacts,
                cache: cache,
                customHeaders: securityHeaders,
            },
            appRoot: "root",
        },
    ],
});

export const microAppBuildSpec = (name: string): BuildSpec => BuildSpec.fromObject({
    version: 1,
    applications: [
        {
            frontend: {
                phases: {
                    preBuild: preBuild,
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
                    preBuild: preBuild,
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
