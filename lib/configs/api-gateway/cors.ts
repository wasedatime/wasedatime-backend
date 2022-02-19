// fixme migration
export const allowOrigins = [
  '*',
  // "https://wasedatime.com",
  // "https://www.wasedatime.com",
  // "https://dev.wasedatime.com",
  // "https://preview.wasedatime.com"
];

export const allowHeaders = [
  'Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token',
];

export const defaultHeaders = {
  'Access-Control-Allow-Headers': '\'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token\'',
  'Access-Control-Allow-Methods': '\'GET,POST,OPTIONS\'',
  'Access-Control-Allow-Origin': '\'*\'',
};
