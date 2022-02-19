import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { SecretValue } from 'aws-cdk-lib';

export const webAppCode = new amplify.GitHubSourceCodeProvider({
  owner: 'wasedatime',
  repository: 'wasedatime-web',
  oauthToken: new SecretValue(process.env.GITHUB_OAUTH_TOKEN),
});
