from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_single_thread(board_id, thread_id, uid=""):

    results = table.query(
        KeyConditionExpression=Key("board_id").eq(
            board_id) & Key("thread_id").eq(thread_id)
    )["Items"]

    if not results:
        raise LookupError

    table.update_item(
        Key={
            "board_id": board_id,
            "thread_id": thread_id,
        },
        UpdateExpression="SET #v = #v + :incr",
        ExpressionAttributeNames={
            '#v': 'views'
        },
        ExpressionAttributeValues={
            ":incr": 1
        }
    )

    item = results[0]

    del item["thread_id"]

    item["mod"] = False
    if item["uid"] == uid:
        item["mod"] = True
    del item["uid"]

    body = JsonPayloadBuilder().add_status(
        True).add_data(item).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread_id": event["pathParameters"]["thread_id"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return get_single_thread(**params)
