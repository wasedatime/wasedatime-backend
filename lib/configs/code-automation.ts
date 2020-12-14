import {GitHubSourceCodeProvider} from "@aws-cdk/aws-amplify";
import {SecretValue, StackProps} from "@aws-cdk/core";
import {BuildSpec} from "@aws-cdk/aws-codebuild/lib/build-spec";

export const webappGithub: GitHubSourceCodeProvider = new GitHubSourceCodeProvider({
    owner: "wasedatime",
    repository: "wasedatime-web",
    oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN)
});

export const webappEnv: { [key: string]: string; } = {
    "REACT_APP_API_BASE_URL": "https://api.wasedatime.com/v1",
    "NODE_OPTIONS": "--max-old-space-size=8192"
};

export const webappBuildSpec: BuildSpec = BuildSpec.fromSourceFilename("/resources/amplify/buildspec.yml");

export const awsEnv: StackProps = {
    env: {
        account: '564383102056',
        region: 'ap-northeast-1'
    }
}