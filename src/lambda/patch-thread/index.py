from boto3.dynamodb.conditions import Attr
import json
from datetime import datetime
from utils import JsonPayloadBuilder, resp_handler, table


@resp_handler
def patch_thread(board_id, uid, thread_id, thread, action):
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    if action == 'update':
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            ConditionExpression=Attr('uid').eq(uid),
            UpdateExpression='SET body = :tbody, title = :ttitle, updated_at = :ts',
            ExpressionAttributeValues={
                ":tbody": thread['body'],
                ":ttitle": thread['title'],
                ":ts": dt_now
            },
        )
    elif action == 'like':
        # Add uid to the 'likes' list if it's not already there
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression='ADD likes :uid',
            ConditionExpression='attribute_not_exists(likes) OR NOT contains (likes, :uid)',
            ExpressionAttributeValues={
                ':uid': {uid}
            },
        )
    elif action == 'dislike':
        # Remove uid from the 'likes' list if it's already there
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression='DELETE likes :uid SET likes = if_not_exists(size(likes), :zero)',
            ConditionExpression='attribute_exists(likes) AND contains (likes, :uid)',
            ExpressionAttributeValues={
                ':uid': {uid},
                ':zero': 0
            },
        )

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread_id": event["pathParameters"]["thread_id"],
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "thread": req.get("data", {}),
        "action": req.get("action", "update")
    }

    return patch_thread(**params)
