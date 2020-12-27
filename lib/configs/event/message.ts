import {EventField} from "@aws-cdk/aws-events";

const APP_ID: string = EventField.fromPath("$.detail.appId");
const BRANCH: string = EventField.fromPath("$.detail.branchName");
const JOB_STAT: string = EventField.fromPath("$.detail.jobStatus");
const JOB_ID: string = EventField.fromPath("$.detail.jobId");
const REGION: string = EventField.fromPath("$.region");
export const AMPLIFY_MESSAGE: string = `Build notification from the AWS Amplify Console for app: https://${BRANCH}.${APP_ID}.amplifyapp.com/. Your build status is ${JOB_STAT}. Go to https://${REGION}.console.aws.amazon.com/amplify/home?region=${REGION}#${APP_ID}/${BRANCH}/${JOB_ID} to view details on your build.`;

const EXEC_NAME: string = EventField.fromPath("$.detail.name");
const EXEC_ARN: string = EventField.fromPath("$.detail.executionArn");
const STAT: string = EventField.fromPath("$.detail.status");
export const SFN_MESSAGE: string = `Task status notification from the AWS StepFunction for execution name: ${EXEC_NAME}. The task status is ${STAT}. Go to https://${REGION}.console.aws.amazon.com/states/home?region=${REGION}#/executions/details/${EXEC_ARN} to view details on the execution.`;