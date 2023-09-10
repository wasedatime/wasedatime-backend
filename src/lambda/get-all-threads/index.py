from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, index, num, school, tags, board_id):

    index = int(index)
    num = int(num)

    if board_id:
        response = table.query(KeyConditionExpression=Key(
            "board_id").eq(board_id), ScanIndexForward=False)["Items"]
    else:
        response = table.scan()

    items = response['Items']

    if school:
        items = [item for item in items if item.get("group_id") in school]
    if tags:
        items = [item for item in items if item.get("tag_id") in tags]

    start_index = index
    end_index = min(len(items), start_index+num)
    paginated_items = items[start_index:end_index]

    for item in paginated_items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    if not board_id:
        paginated_items = sorted(paginated_items, key=lambda x: x.get(
            'created_at', ''), reverse=True)

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_items).add_message(end_index).compile()

    return body


def handler(event, context):

    board_id = ""
    uid = ""
    index = 0  # default index
    num = 10  # default num
    school = ""  # default school
    tags = ""

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        board_id = params.get("board_id", "")
        uid = params.get("uid", "")
        index = params.get("index")
        num = params.get("num")
        school = params.get("school")
        tags = params.get("tags")

        if school:
            school = school.split(',')
        if tags:
            tags = tags.split(',')

    return get_all_threads(uid, index, num, school, tags, board_id)
