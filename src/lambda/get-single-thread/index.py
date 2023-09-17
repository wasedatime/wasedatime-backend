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
        UpdateExpression="SET #v = #v + :incr, #nc = :newComment",
        ExpressionAttributeNames={
            '#v': 'views',
            '#nc': 'comment_count'
        },
        ExpressionAttributeValues={
            ":incr": 1,
            ":newComment": False
        }
    )

    item = results[0]

    item["mod"] = False
    if item["uid"] == uid:
        item["mod"] = True
    item['user_liked'] = uid in item.get('likes', [])
    item['total_likes'] = len(item.get('likes', []))

    item.pop('uid', None)
    item.pop('likes', None)

    body = JsonPayloadBuilder().add_status(
        True).add_data(item).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread_id": event["pathParameters"]["thread_id"],
    }
    if "uid" in event["queryStringParameters"]:
        params["uid"] = event["queryStringParameters"]["uid"]

    return get_single_thread(**params)
