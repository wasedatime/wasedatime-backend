from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, index, num, school, tags, board_id):
    index = int(index)
    num = int(num)

    print(
        f"Received parameters: uid={uid}, index={index}, num={num}, school={school}, tags={tags}, board_id={board_id}")

    if board_id:
        print(f"Querying DynamoDB with board_id={board_id}")
        response = table.query(KeyConditionExpression=Key(
            "board_id").eq(board_id), ScanIndexForward=False)
        print(f"Received response from DynamoDB: {response}")
    else:
        print("Scanning DynamoDB")
        response = table.scan()
        print(f"Received response from DynamoDB: {response}")

    items = response['Items']
    print(f"Items before filtering: {items}")

    if school:
        items = [item for item in items if item.get("group_id") in school]
    if tags:
        items = [item for item in items if item.get("tag_id") in tags]

    print(f"Items after filtering: {items}")

    start_index = index
    end_index = min(len(items), start_index+num)
    paginated_items = items[start_index:end_index]

    for item in paginated_items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True
        item.pop('uid', None)

    if not board_id:
        paginated_items = sorted(paginated_items, key=lambda x: x.get(
            'thread_id', ''), reverse=True)

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
        index = params.get("index", 0)
        num = params.get("num", 10)
        school = params.get("school")
        tags = params.get("tags")

        if school:
            school = school.split(',')
        if tags:
            tags = tags.split(',')

    return get_all_threads(uid, index, num, school, tags, board_id)
