from boto3.dynamodb.conditions import Key
import json
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler, build_thread_id
import uuid


@resp_handler
def post_thread(board_id, thread, uid):

    thread_id = build_thread_id()

    text = thread["body"]

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    thread_item = {
        "board_id": board_id,
        "created_at": dt_now,
        "updated_at": dt_now,
        "title": thread["title"],
        "body": text,
        "uid": uid,
        "thread_id": thread_id,
        "tag_id": thread["tag_id"],
        "group_id": thread["group_id"],
        "univ_id": thread["univ_id"],
        "views": 0,
        "likes": [],
    }

    table.put_item(Item=thread_item)

    thread_item.pop('uid', None)
    thread_item["mod"] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(thread_item).add_message('').compile()
    return body


def handler(event, context):

    req = json.loads(event['body'])
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return post_thread(**params)
