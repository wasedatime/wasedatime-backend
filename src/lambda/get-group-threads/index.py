# from boto3.dynamodb.conditions import Key, Attr
# import boto3
# from datetime import datetime
# from utils import JsonPayloadBuilder, table, resp_handler


# @resp_handler
# def get_group_threads(board_id, group_id, tag_id):

#     if group_id is not None and tag_id is not None:
#         results = table.query(KeyConditionExpression=Key(
#             "board_id").eq(board_id) & Key("group_id").eq(group_id),
#             IndexName="groupIndex",
#             FilterExpression=Attr('tag_id').eq(tag_id))["Items"]
#         if not results:
#             raise LookupError

#     body = JsonPayloadBuilder().add_status(
#         True).add_data(results).add_message('').compile()
#     return body


# def handler(event, context):

#     params = {
#         "board_id": event["pathParameters"]["board_id"]
#     }

#     group_id = event["queryStringParameters"]["group_id"]
#     tag_id = event["queryStringParameters"]["tag_id"]

#     if group_id is not None and tag_id is not None:
#         params["group_id"] = group_id
#         params["tag_id"] = tag_id
#     elif group_id is not None and tag_id is None:
#         params["group_id"] = group_id
#         params["tag_id"] = None
#     elif tag_id is not None and group_id is None:
#         params["group_id"] = None
#         params["tag_id"] = tag_id
#     else:
#         params["group_id"] = None
#         params["tag_id"] = None

#     return get_group_threads(**params)
def handler(event, context):
    pass
