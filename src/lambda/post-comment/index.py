import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def post_comment(thread_id, comment, uid=''):

    text = comment["body"]

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    thread_comment = {
        "thread_id": thread_id,
        "created_at": dt_now,
        "updated_at": dt_now,
        "body": text,
        "uid": uid
    }
    table.put_item(Item=thread_comment)

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "thread_id": event["pathParameters"]["thread_id"],
        "comment": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return post_comment(**params)
