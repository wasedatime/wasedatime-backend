# from boto3.dynamodb.conditions import Key
# from datetime import datetime
# from utils import JsonPayloadBuilder, table, resp_handler


# @resp_handler
# def get_thread(thread_id):
#     now = datetime.now()

#     items = table.query(
#         KeyConditionExpression='sort_key <= :sk',
#         ExpressionAttributeValues={
#             ':sk': now.strftime('%Y-%m-%d %H:%M:%S')
#         },
#         ScanIndexForward=False,
#         Limit=50
#     )

#     body = JsonPayloadBuilder().add_status(
#         True).add_data(items).add_message('').compile()
#     return body


# def handler(event, context):
#     params = {
#         "thread_id": event["queryStringParameters"]["id"]
#     }

#     return get_thread(**params)
