from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler, s3_client, bucket, generate_url


@resp_handler
def get_single_thread(board_id, thread_id, uid=""):
    results = table.query(
        KeyConditionExpression=Key("board_id").eq(
            board_id) & Key("thread_id").eq(thread_id)
    )["Items"]

    if not results:
        raise LookupError

    item = results[0]

    if item["uid"] == uid:
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression="SET #v = #v + :incr, #nc = :newComment",
            ConditionExpression="#uid = :uidValue",
            ExpressionAttributeNames={
                '#v': 'views',
                '#nc': 'new_comment',
                '#uid': 'uid'
            },
            ExpressionAttributeValues={
                ":incr": 1,
                ":newComment": False,
                ":uidValue": uid
            }
        )
    else:
        # Increment the view count but do not update new_comment
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

    item["mod"] = False
    if item["uid"] == uid:
        item["mod"] = True
    item['user_liked'] = uid in item.get('likes', [])
    item['total_likes'] = len(item.get('likes', []))

    if "obj_key" in item:
        bucket_name = bucket
        presigned_url = generate_url(bucket_name, item["obj_key"])
        if presigned_url:
            item["url"] = presigned_url

    item.pop('uid', None)
    item.pop('likes', None)
    item.pop('obj_key', None)

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
