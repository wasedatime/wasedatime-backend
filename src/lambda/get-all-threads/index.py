from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, index, num, school):

    index = int(index)
    num = int(num)

    response = table.scan()
    items = response['Items']

    if school:
        items = [item for item in items if item.get("group_id") in school]

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

    body = JsonPayloadBuilder().add_status(
        True).add_data(paginated_items).add_message(end_index).compile()

    return body


def handler(event, context):

    # uid = ""
    # index = "0"  # default index
    # num = "10"  # default num
    # school = ""  # default school

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        uid = params.get("uid", "")
        index = params.get("index")
        num = params.get("num")
        school = params.get("school")

        if school:
            school = school.split(',')

    return get_all_threads(uid, index, num, school)
