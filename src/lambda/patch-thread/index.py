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

        response = table.get_item(Key={
            "board_id": board_id,
            "thread_id": thread_id,
        }
        )

        current_likes = response['Item'].get('likes', set())

        # if only one like, remove the set entirely
        if len(current_likes) == 1 and uid in current_likes:
            table.update_item(
                Key={
                    "board_id": board_id,
                    "thread_id": thread_id,
                },
                UpdateExpression='REMOVE likes',
                ConditionExpression='attribute_exists(likes)',
            )

        # else, just delete the uid from set likes
        else:
            table.update_item(
                Key={
                    "board_id": board_id,
                    "thread_id": thread_id,
                },
                UpdateExpression='DELETE likes :uid',
                ConditionExpression='attribute_exists(likes) AND contains (likes, :uid)',
                ExpressionAttributeValues={
                    ':uid': {uid}
                },
            )
    # Update comment_count by 1
    elif action == 'update_count':
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression="SET #c = #c + :incr, #nc = :newComment",
            ExpressionAttributeNames={
                '#c': 'comment_count',
                '#nc': 'new_comment'
            },
            ExpressionAttributeValues={
                ":incr": 1,
                ":newComment": True
            }
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
