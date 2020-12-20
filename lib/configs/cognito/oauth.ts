require('dotenv').config();


export const GOOGLE_OAUTH_CLIENT_ID: string = process.env.GOOGLE_OAUTH_CLIENT_ID!;

export const GOOGLE_OAUTH_CLIENT_SECRET: string = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

export const CALLBACK_URLS: string[] = ['https://wasedatime.com/verify'];

export const LOGOUT_URLS: string[] = ['https://wasedatime.com/logout'];