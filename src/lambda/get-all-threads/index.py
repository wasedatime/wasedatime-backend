from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid=""):

    response = table.scan()
    items = response['Items']

    for item in items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(items).add_message('').compile()
    return body


def handler(event, context):

    uid = ""

    if "uid" in event["queryStringParameters"]:
        uid = event["queryStringParameters"]["uid"]

    return get_all_threads(uid)
