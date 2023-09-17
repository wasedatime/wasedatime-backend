from boto3.dynamodb.conditions import Attr
import json
from datetime import datetime
from utils import JsonPayloadBuilder, resp_handler, table


@resp_handler
def patch_thread(board_id, uid, thread_id, thread, action):
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    print(
        f"Action: {action}, Board ID: {board_id}, Thread ID: {thread_id}, UID: {uid}")

    if action == 'update':
        print("action update triggered")
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
        print("action like triggered")
        # Add uid to the 'likes' list if it's not already there
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression='ADD likes :uid',
            ConditionExpression='attribute_not_exists(likes) OR NOT contains(likes, :uid)',
            ExpressionAttributeValues={
                ':uid': {uid}
            },
        )
    elif action == 'dislike':
        print("action dislike triggered")
        # Remove uid from the 'likes' list if it's already there

        response = table.get_item(Key={
            "board_id": board_id,
            "thread_id": thread_id,
        }
        )
        if 'Item' in response:
            print(f"Current item: {response['Item']}")
            current_likes = response['Item'].get('likes', set())
            print(f"Current likes: {current_likes}")
        else:
            print("Item not found in DynamoDB")
            return

        print(f"Attempting to remove UID {uid} from likes")

        current_likes = response['Item'].get('likes', set())
        print("Current likes: ", current_likes)

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
            print(f"ELSE statement triggered. UID: {uid}")
            try:
                table.update_item(
                    Key={
                        "board_id": board_id,
                        "thread_id": thread_id,
                    },
                    UpdateExpression='DELETE likes :uid',
                    ConditionExpression='attribute_exists(likes) AND contains(likes, :uid)',
                    ExpressionAttributeValues={
                        ':uid': [uid]
                    },
                )
            except Exception as e:
                print(f"Exception: {e}")
    # Increase comment_count by 1
    elif action == 'update_incr':
        print("action count increased triggered")
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

    # Decrease comment_count by 1
    elif action == 'update_decr':
        print("action count decrease triggered")
        # Fetch the current item to get the current comment_count
        response = table.get_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            }
        )
        current_comment_count = response['Item'].get('comment_count', 0)
        new_comment_flag = True  # Default to True

        # If decrementing would result in 0 comments, set newComment to False
        if current_comment_count - 1 == 0:
            new_comment_flag = False

        # Update the comment_count and newComment flag
        table.update_item(
            Key={
                "board_id": board_id,
                "thread_id": thread_id,
            },
            UpdateExpression="SET #c = #c - :decr, #nc = :newComment",
            ExpressionAttributeNames={
                '#c': 'comment_count',
                '#nc': 'new_comment'
            },
            ExpressionAttributeValues={
                ":decr": 1,
                ":newComment": new_comment_flag
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
