// fixme migration
export const s3RespMapping = {
    ['method.response.header.Access-Control-Allow-Origin']: "'*'",
    ['method.response.header.Cache-Control']: 'integration.response.header.Cache-Control',
    ['method.response.header.ETag']: 'integration.response.header.ETag',
    ['method.response.header.Last-Modified']: 'integration.response.header.Last-Modified',
    ['method.response.header.Expires']: 'integration.response.header.Expires'
};

export const syllabusRespParams = {
    ['method.response.header.Access-Control-Allow-Origin']: true,
    ['method.response.header.Cache-Control']: true,
    ['method.response.header.ETag']: true,
    ['method.response.header.Last-Modified']: true,
    ['method.response.header.Expires']: true
};

export const lambdaRespParams = {
    ['method.response.header.Access-Control-Allow-Origin']: true,
    ['method.response.header.Content-Type']: true,
    ['method.response.header.Referrer-Policy']: true,
    ['method.response.header.Access-Control-Allow-Methods']: true
};

export const mockRespMapping = {
    ['method.response.header.Access-Control-Allow-Origin']: "'*'",
    ['method.response.header.Content-Type']: "'application/json'"
};