import {GitHubSourceCodeProvider} from "@aws-cdk/aws-amplify";
import {SecretValue} from "@aws-cdk/core";

require('dotenv').config();


export const webAppCode: GitHubSourceCodeProvider = new GitHubSourceCodeProvider({
    owner: "wasedatime",
    repository: "wasedatime-web",
    oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN),
});