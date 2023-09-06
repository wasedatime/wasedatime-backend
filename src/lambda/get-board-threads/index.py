from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_board_threads(board_id, uid=''):

    results = table.query(KeyConditionExpression=Key(
        "board_id").eq(board_id), ScanIndexForward=False)["Items"]
    if not results:
        raise LookupError

    for item in results:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(results).add_message('').compile()
    return body


def handler(event, context):

    params = {
        "board_id": event["pathParameters"]["board_id"]
    }
    if "uid" in event["queryStringParameters"]:
        params["uid"] = event["queryStringParameters"]["uid"]

    return get_board_threads(**params)
