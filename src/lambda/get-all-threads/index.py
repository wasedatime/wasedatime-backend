from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, index, num, school, tags):

    index = int(index)
    num = int(num)

    response = table.scan()
    items = response['Items']

    if school:
        items = [item for item in items if item.get("group_id") in school]
    if tags:
        items = [item for item in items if item.get("tag_id") in tags]

    print(f"length of fetched items {len(items)}")

    start_index = index
    end_index = min(len(items), start_index+num)
    paginated_items = items[start_index:end_index]

    print(f"Starting Index : {start_index}")
    print(f"Ending Index : {end_index}")
    print(f"Length of Paginated items : {len(paginated_items)}")

    for item in paginated_items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True

    paginated_items = sorted(paginated_items, key=lambda x: x.get(
        'created_at', ''), reverse=True)

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_items).add_message(end_index).compile()

    return body


def handler(event, context):

    uid = ""
    index = "0"  # default index
    num = "10"  # default num
    school = ""  # default school
    tags = ""

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = params.get("index")
        num = params.get("num")
        school = params.get("school")
        tags = params.get("tags")

        if school:
            school = school.split(',')
        if tags:
            tags = tags.split(',')

    return get_all_threads(uid, index, num, school, tags)
