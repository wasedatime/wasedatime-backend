from boto3.dynamodb.conditions import Key
import json
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def post_thread(board_id, thread, uid):

    text = thread["body"]
    thread_id = "thisthat"

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    thread_item = {
        "board_id": board_id,
        "created_at": dt_now,
        "updated_at": dt_now,
        "title": thread["title"],
        "body": text,
        "uid": uid,
        "thread_id": thread_id,
        "group_id": thread["group_id"],
        "univ_id": thread["univ_id"]
    }

    table.put_item(thread_item)

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):

    req = json.loads(event['body'])
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return post_thread(**params)