require('dotenv').config();


export const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;

export const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

export const CALLBACK_URLS = ['https://wasedatime.com/verify'];

export const LOGOUT_URLS = ['https://wasedatime.com/logout'];