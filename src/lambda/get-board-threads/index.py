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

    uid = ""
    index = "0"  # default index
    num = "10"  # default num
    school = ""  # default school
    board_id = event["pathParameters"]["board_id"]  # from path parameters

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = params.get("index", "0")
        num = params.get("num", "10")
        school = params.get("school", "")

        if school:
            school = school.split(',')

    return get_board_threads(uid, index, num, school, board_id)
