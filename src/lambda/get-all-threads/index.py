from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, index, num):

    index = int(index)
    num = int(num)

    print([index, num])
    response = table.scan()
    items = response['Items']

    start_index = index

    end_index = min(len(items), start_index+num)
    paginated_items = items[start_index:end_index]

    for item in paginated_items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_items).add_message('').compile()

    return body


def handler(event, context):

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = params.get("index")
        num = params.get("num")

    return get_all_threads(uid, index, num)
