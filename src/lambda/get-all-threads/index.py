from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads(uid, school, tags, board_id, last_evaluated_key=None):

    query_params = {
        'Limit': 10,
    }

    if last_evaluated_key:
        query_params["ExclusiveStartKey"] = last_evaluated_key

    if board_id:
        query_params.update({
            'KeyConditionExpression': Key('board_id').eq(board_id),
            'ScanIndexForward': False
        })
        response = table.query(**query_params)

    else:
        response = table.scan(**query_params)

    items = response['Items']
    last_evaluated_key = response.get('LastEvaluatedKey')

    if school:
        items = [item for item in items if item.get("group_id") in school]
    if tags:
        items = [item for item in items if item.get("tag_id") in tags]

    if not board_id:
        items = sorted(items, key=lambda x: x.get(
            'created_at', ''), reverse=True)

    for item in items:
        item['mod'] = False
        if 'uid' in item and item['uid'] == uid:
            item['mod'] = True
        item.pop('uid', None)

    # if not board_id:
    #     paginated_items = sorted(paginated_items, key=lambda x: x.get(
    #         'thread_id', ''), reverse=True)

    body = JsonPayloadBuilder().add_status(
        True).add_data(items).add_message(last_evaluated_key).compile()

    return body


def handler(event, context):

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        board_id = params.get("board_id", "")
        uid = params.get("uid", "")
        school = params.get("school", "")
        tags = params.get("tags", "")
        last_evaluated_key = params.get("last_evaluated_key", "")

        if school:
            school = school.split(',')
        if tags:
            tags = tags.split(',')

    return get_all_threads(uid, school, tags, board_id, last_evaluated_key)


# from boto3.dynamodb.conditions import Key
# import boto3
# from datetime import datetime
# from utils import JsonPayloadBuilder, table, resp_handler


# @resp_handler
# def get_all_threads(uid, index, num, school, tags, board_id):
#     index = int(index)
#     num = int(num)

#     print(
#         f"Received parameters: uid={uid}, index={index}, num={num}, school={school}, tags={tags}, board_id={board_id}")

#     if board_id:
#         print(f"Querying DynamoDB with board_id={board_id}")
#         response = table.query(KeyConditionExpression=Key(
#             "board_id").eq(board_id), ScanIndexForward=False)
#         print(f"Received response from DynamoDB: {response}")
#     else:
#         print("Scanning DynamoDB")
#         response = table.scan()
#         print(f"Received response from DynamoDB: {response}")

#     items = response['Items']
#     print(f"Items before filtering: {items}")

#     if school:
#         items = [item for item in items if item.get("group_id") in school]
#     if tags:
#         items = [item for item in items if item.get("tag_id") in tags]

#     print(f"Items after filtering: {items}")

#     if not board_id:
#         items = sorted(items, key=lambda x: x.get(
#             'created_at', ''), reverse=True)

#     start_index = index
#     end_index = min(len(items), start_index+num)
#     paginated_items = items[start_index:end_index]

#     for item in paginated_items:
#         item['mod'] = False
#         if 'uid' in item and item['uid'] == uid:
#             item['mod'] = True
#         item.pop('uid', None)

#     # if not board_id:
#     #     paginated_items = sorted(paginated_items, key=lambda x: x.get(
#     #         'thread_id', ''), reverse=True)

#     body = JsonPayloadBuilder().add_status(
#         True).add_data(paginated_items).add_message(end_index).compile()

#     return body


# def handler(event, context):

#     board_id = ""
#     uid = ""
#     index = 0  # default index
#     num = 10  # default num
#     school = ""  # default school
#     tags = ""

#     if "queryStringParameters" in event:
#         params = event["queryStringParameters"]
#         board_id = params.get("board_id", "")
#         uid = params.get("uid", "")
#         index = params.get("index", 0)
#         num = params.get("num", 10)
#         school = params.get("school")
#         tags = params.get("tags")

#         if school:
#             school = school.split(',')
#         if tags:
#             tags = tags.split(',')

#     return get_all_threads(uid, index, num, school, tags, board_id)
