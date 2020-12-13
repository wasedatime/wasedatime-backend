import {GitHubSourceCodeProvider} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";
import {BuildSpec} from "@aws-cdk/aws-codebuild/lib/build-spec";

export const webappGithub = new GitHubSourceCodeProvider({
    owner: "wasedatime",
    repository: "wasedatime-web",
    oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN)
});

export const webappEnv = {
    ["REACT_APP_API_BASE_URL"]: "https://api.wasedatime.com/v1",
    ["NODE_OPTIONS"]: "--max-old-space-size=8192"
}

export const webappBuildSpec: BuildSpec = BuildSpec.fromSourceFilename("/resources/amplify/buildspec.yml");