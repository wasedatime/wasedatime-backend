import logging
from boto3.dynamodb.conditions import Attr

from utils import JsonPayloadBuilder, api_response, table


def delete_review(key, ts, uid):
    table.delete_item(
        Key={
            "course_key": key,
            "created_at": ts
        },
        ConditionExpression=Attr('uid').eq(uid)
    )

    resp_body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return resp_body


def handler(event, context):
    headers = event["headers"]
    # if bad_referer(headers):
    #     logging.warning(f"External Request from {headers['X-Forwarded-For']}:headers['X-Forwarded-Port']")
    #     resp = JsonPayloadBuilder().add_status(False).add_data(None) \
    #         .add_message("External request detected, related information will be reported to admin.").compile()
    #     return api_response(403, resp)

    key = event["pathParameters"]["key"]
    create_time = event["queryStringParameters"]["ts"]

    uid = event['requestContext']['authorizer']['claims']['sub']

    try:
        resp = delete_review(key, create_time, uid)
        return api_response(200, resp)
    except Exception as e:
        logging.error(str(e))
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, resp)
