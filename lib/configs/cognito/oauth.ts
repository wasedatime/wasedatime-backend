export const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;

export const GOOGLE_OAUTH_CLIENT_SECRET =
  process.env.GOOGLE_OAUTH_CLIENT_SECRET!;

export const CALLBACK_URLS = [
  'https://wasedatime.com/verify',
  'https://dev.wasedatime.com/verify',
  'localhost:3000/verify',
  'wasedati',
];

export const LOGOUT_URLS = [
  'https://wasedatime.com/',
  'https://dev.wasedatime.com/',
  'localhost:3000/',
];

export const FLUTTER_CALLBACK_URL = ['wasedatime://verify'];

export const FLUTTER_LOGOUT_URL = ['wasedatime://'];
