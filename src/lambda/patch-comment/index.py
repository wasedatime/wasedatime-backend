import json
from boto3.dynamodb.conditions import Attr
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def patch_comment(thread_id, ts, uid, comment):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    table.update_item(
        Key={
            "thread_id": thread_id,
            "created_at": ts,
        },
        ConditionExpression=Attr('uid').eq(uid),
        UpdateExpression='SET body = :cbody, update_at = :ts',
        ExpressionAtrributeValues={
            ":tbody": [comment['body']],
            ":ts": dt_now
        }
    )

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):

    req = json.loads(event['body'])
    params = {
        "thread_id": event["pathParameters"]["thread_id"],
        "ts": event["queryStringParameters"]["ts"],
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "comment": req["data"]
    }

    return patch_comment(**params)
