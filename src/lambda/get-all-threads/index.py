from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid="", board_id=None, last_evaluated_key=None, limit=10):

    if board_id:
        query_params = {
            'KeyConditionExpression': Key('board_id').eq(board_id),
            'Limit': limit
        }

        # If there's a last evaluated key, add it to the query parameters
        if last_evaluated_key:
            query_params['ExclusiveStartKey'] = {
                'board_id': board_id,
                'thread_id': last_evaluated_key
            }

        response = table.query(**query_params)
    else:
        # If board_id is not provided, scan may be inefficient for large tables
        response = table.scan()

    items = response['Items']

    # Add mod field
    for item in items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    result = {
        'items': items,
        'last_evaluated_key': response.get('LastEvaluatedKey', {}).get('thread_id')
    }

    body = JsonPayloadBuilder().add_status(
        True).add_data(result).add_message('').compile()

    return body


def handler(event, context):
    uid = ""
    board_id = None
    last_evaluated_key = None
    limit = 10

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        board_id = params.get("board_id", None)
        last_evaluated_key = params.get("last_evaluated_key", None)
        limit = int(params.get("limit", 10))

    return get_all_threads(uid, board_id, last_evaluated_key, limit)
