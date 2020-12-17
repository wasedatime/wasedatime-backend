import {GitHubSourceCodeProvider} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";


export const webAppCode: GitHubSourceCodeProvider = new GitHubSourceCodeProvider({
    owner: "wasedatime",
    repository: "wasedatime-web",
    oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN)
});

export const apiDocCode: GitHubSourceCodeProvider = new GitHubSourceCodeProvider({
    owner: "wasedatime",
    repository: "wasedatime-openapi",
    oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN)
});