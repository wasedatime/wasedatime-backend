from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_board_threads(uid, index, num, school, board_id, tags):

    index = int(index)
    num = int(num)

    results = table.query(KeyConditionExpression=Key(
        "board_id").eq(board_id), ScanIndexForward=False)["Items"]
    if not results:
        raise LookupError

    if school:
        results = [item for item in results if item.get("group_id") in school]
    if tags:
        results = [item for item in results if item.get("tag_id") in tags]

    start_index = index
    end_index = min(len(results), start_index + num)
    paginated_results = results[start_index:end_index]

    for item in paginated_results:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_results).add_message(end_index).compile()
    return body


def handler(event, context):

    uid = ""
    index = "0"  # default index
    num = "10"  # default num
    school = ""  # default school
    board_id = event["pathParameters"]["board_id"]  # from path parameters
    tags = ""

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = params.get("index", "0")
        num = params.get("num", "10")
        school = params.get("school", "")
        tags = params.get("tags", "")

        if school:
            school = school.split(',')
        if tags:
            tags = tags.split(',')

    return get_board_threads(uid, index, num, school, board_id, tags)
