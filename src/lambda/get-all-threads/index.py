from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid="", index=0, num=5):
    response = table.scan()
    items = response['Items']

    start_index = index

    end_index = start_index + num
    paginated_items = items[start_index:end_index]

    for item in paginated_items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_items).add_message('').compile()

    return body


def handler(event, context):
    uid = ""
    index = 1
    num = 5

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = int(params.get("page", 1))
        num = int(params.get("num", 5))

    return get_all_threads(uid, index, num)
