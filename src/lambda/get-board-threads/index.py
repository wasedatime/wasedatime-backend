# from boto3.dynamodb.conditions import Key
# import boto3
# from datetime import datetime
# from utils import JsonPayloadBuilder, table, resp_handler


# @resp_handler
# def get_board_threads(board_id):

#     results = table.query(KeyConditionExpression=Key(
#         "board_id").eq(board_id), ScanIndexForward=False)["Items"]
#     if not results:
#         raise LookupError

#     body = JsonPayloadBuilder().add_status(
#         True).add_data(results).add_message('').compile()
#     return body


# def handler(event, context):

#     params = {
#         "board_id": event["pathParameters"]["board_id"]
#     }

#     return get_board_threads(**params)
def handler(event, context):
    pass
