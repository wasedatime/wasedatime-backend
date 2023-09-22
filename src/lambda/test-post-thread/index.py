from boto3.dynamodb.conditions import Key
import json
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler, build_thread_id, s3_client, bucket
import uuid
import base64


@resp_handler
def test_post_thread(thread, uid):

    thread_id = build_thread_id()

    text = thread["body"]

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    object_key = None
    if "image" in thread:
        image_data = base64.b64decode(thread["image"])
        content_type = thread.get("contentType", "image/jpeg")
        # Validate the content type
        if content_type not in ["image/jpeg", "image/png", "image/gif"]:
            raise ValueError("Invalid content type")
        # Extracts 'jpeg', 'png', or 'gif' from the MIME type
        extension = content_type.split("/")[-1]
        object_key = f"{thread_id}/image.{extension}"

        s3_client.put_object(Bucket=bucket, Key=object_key,
                             Body=image_data, ContentType=content_type)

    thread_item = {
        "board_id": thread["board_id"],
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
        "comment_count": 0,
        "new_comment": False,
        "obj_key": object_key,
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
        # "board_id": event["pathParameters"]["board_id"],
        "thread": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return test_post_thread(**params)
