import {BuildSpec} from "@aws-cdk/aws-codebuild/lib/build-spec";


export const webappBuildSpec: BuildSpec = BuildSpec.fromObject({
    "version": 1,
    "frontend": {
        "phases": {
            "preBuild": {
                "commands": [
                    "npm ci"
                ]
            },
            // IMPORTANT - Please verify your build commands
            "build": {
                "commands": [
                    "if [ \"${AWS_BRANCH}\" = \"master\" ]; then npm run build; fi",
                    "if [[ \"${AWS_BRANCH}\" = \"release/\"* ]]; then npm run build-staging; fi",
                    "if [ \"${AWS_BRANCH}\" = \"develop\" ]; then npm run build-dev; fi",
                    "if [[ \"${AWS_BRANCH}\" = \"feature/\"* ]]; then npm run build-dev; fi"
                ]
            }
        },
        "artifacts": {
            // IMPORTANT - Please verify your build output directory
            "baseDirectory": "/build",
            "files": [
                "**/*"
            ]
        },
        "cache": {
            "paths": [
                "node_modules/**/*"
            ]
        },
        "customHeaders": [
            {
                // Security policies
                "pattern": "**/*",
                "headers": [
                    {
                        "key": "Strict-Transport-Security",
                        "value": "max-age=15552000; includeSubDomains"
                    },
                    {
                        "key": "X-Frame-Options",
                        "value": "SAMEORIGIN"
                    },
                    {
                        "key": "X-XSS-Protection",
                        "value": "1; mode=block"
                    },
                    {
                        "key": "X-Content-Type-Options",
                        "value": "nosniff"
                    },
                    {
                        "key": "Content-Security-Policy",
                        "value": "default-src 'self' 'unsafe-inline' https: data:; script-src 'unsafe-inline' 'self' https://storage.googleapis.com/ https://www.google-analytics.com/;"
                    },
                    {
                        "key": "X-Content-Security-Policy",
                        "value": "default-src 'self' 'unsafe-inline' https: data:; script-src 'unsafe-inline' 'self' https://storage.googleapis.com/ https://www.google-analytics.com/;"
                    },
                    {
                        "key": "X-WebKit-CSP",
                        "value": "default-src 'self' 'unsafe-inline' https: data:; script-src 'unsafe-inline' 'self' https://storage.googleapis.com/ https://www.google-analytics.com/;"
                    },
                    {
                        "key": "X-Download-Options",
                        "value": "noopen"
                    },
                    {
                        "key": "X-DNS-Prefetch-Control",
                        "value": "off"
                    }
                ]
            }
        ]
    }
});

export const webappDevBuildSpec: BuildSpec = BuildSpec.fromObject({
    "version": 1,
    "frontend": {
        "phases": {
            "preBuild": {
                "commands": ["npm ci"]
            },
            // IMPORTANT - Please verify your build commands
            "build": {
                "commands": ["npm run build-dev"]
            }
        },
        "artifacts": {
            // IMPORTANT - Please verify your build output directory
            "baseDirectory": "/build",
            "files": ["**/*"]
        },
        "cache": {
            "paths": ["node_modules/**/*"]
        }
    }
});

export const microAppBuildSpec = (name: string): BuildSpec => BuildSpec.fromObject({
    "version": 1,
    "applications": [
        {
            "frontend": {
                "phases": {
                    "preBuild": {
                        "commands": ["npm ci"]
                    },
                    // IMPORTANT - Please verify your build commands
                    "build": {
                        "commands": ["npm run build"]
                    }
                },
                "artifacts": {
                    // IMPORTANT - Please verify your build output directory
                    "baseDirectory": "/dist",
                    "files": ["**/*"]
                },
                "cache": {
                    "paths": ["node_modules/**/*"]
                }
            },
            "appRoot": name
        }
    ]
});

export const microAppDevBuildSpec = (name: string): BuildSpec => BuildSpec.fromObject({
    "version": 1,
    "applications": [
        {
            "frontend": {
                "phases": {
                    "preBuild": {
                        "commands": ["npm ci"]
                    },
                    // IMPORTANT - Please verify your build commands
                    "build": {
                        "commands": [
                            "export PREFIX=\"${AWS_BRANCH//[\\/_]/-}\"",
                            "npm run build"
                        ]
                    }
                },
                "artifacts": {
                    // IMPORTANT - Please verify your build output directory
                    "baseDirectory": "/dist",
                    "files": ["**/*"]
                },
                "cache": {
                    "paths": ["node_modules/**/*"]
                },
                "customHeaders": [
                    {
                        "pattern": "**/*",
                        "headers": [
                            {
                                "key": "Access-Control-Allow-Origin",
                                "value": "*"
                            }
                        ]
                    }
                ]
            },
            "appRoot": name
        }
    ]
});
