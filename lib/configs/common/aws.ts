import {StackProps} from "@aws-cdk/core";

require('dotenv').config();


export const awsEnv: StackProps = {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
};

export const cognitoEnv: StackProps = {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.COGNITO_AFFILIATE_REGION
    }
}

export enum AwsServicePrincipal {

    ACM = "acm.amazonaws.com",

    AMAZON_MQ = "amazonmq.amazonaws.com",

    AMPLIFY = "amplify.amazonaws.com",

    API_GATEWAY = "apigateway.amazonaws.com",

    APPSYNC = "appsync.amazonaws.com",

    ATHENA = "athena.amazonaws.com",

    AUTOSCALING = "autoscaling.amazonaws.com",

    CLOUDFORMATION = "cloudformation.amazonaws.com",

    CLOUDFRONT = "cloudfront.amazonaws.com",

    CLOUDWATCH = "cloudwatch-crossaccount.amazonaws.com",

    CODEBUILD = "codebuild.amazonaws.com",

    COGNITO = "cognito-identity.amazonaws.com",

    COGNITO_USER_POOL = "cognito-idp.amazonaws.com",

    DATA_PIPELINE = "datapipeline.amazonaws.com",

    DYNAMODB = "dynamodb.amazonaws.com",

    DYNAMODB_AUTOSCALING = "dynamodb.application-autoscaling.amazonaws.com",

    EC2 = "ec2.amazonaws.com",

    EC2_AUTOSCALING = "ec2.application-autoscaling.amazonaws.com",

    ECS = "ecs.amazonaws.com",

    ECS_TASKS = "ecs-tasks.amazonaws.com",

    EKS = "eks.amazonaws.com",

    ELB = "elasticloadbalancing.amazonaws.com",

    ELASTIC_BEANSTALK = "elasticbeanstalk.amazonaws.com",

    EVENT_BRIDGE = "events.amazonaws.com",

    IAM = "iam.amazonaws.com",

    IoT = "iot.amazonaws.com",

    KINESIS = "kinesis.amazonaws.com",

    KINESIS_ANALYTICS = "kinesisanalytics.amazonaws.com",

    KMS = "kms.amazonaws.com",

    LAMBDA = "lambda.amazonaws.com",

    LAMBDA_EDGE = "edgelambda.amazonaws.com",

    LOGS = "logs.amazonaws.com",

    PINPOINT = "pinpoint.amazonaws.com",

    RDS = "rds.amazonaws.com",

    ROUTE53 = "route53.amazonaws.com",

    ROUTE53_DOMAIN = "route53domains.amazonaws.com",

    ROUTE53_RESOLVER = "route53resolver.amazonaws.com",

    S3 = "s3.amazonaws.com",

    SES = "ses.amazonaws.com",

    SHIELD = "shield.amazonaws.com",

    SIGN_IN = "signin.amazonaws.com",

    SMS = "sms.amazonaws.com",

    SNS = "sns.amazonaws.com",

    SQS = "sqs.amazonaws.com",

    STEP_FUNCTIONS = "states.amazonaws.com",

    TRANSLATE = "translate.amazonaws.com",

    WAF = "waf.amazonaws.com",

    XRAY = "xray.amazonaws.com"
}