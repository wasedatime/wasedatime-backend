require('dotenv').config();

export const GOOGLE_API_KEY: string = process.env.GOOGLE_API_KEY!;

export const SLACK_WEBHOOK_AMP: string = process.env.SLACK_WEBHOOK_AMP!;

export const SLACK_WEBHOOK_CFN: string = process.env.SLACK_WEBHOOK_CFN!;

export const SLACK_WEBHOOK_SFN: string = process.env.SLACK_WEBHOOK_SFN!;