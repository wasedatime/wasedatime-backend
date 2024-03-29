from boto3.dynamodb.conditions import Attr
import boto3

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def delete_thread(board_id, thread_id, uid):

    table.delete_item(
        Key={
            "board_id": board_id,
            "thread_id": thread_id,
        },
        ConditionExpression=Attr('uid').eq(
            uid)
    )

    resp_body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return resp_body


def handler(event, context):
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread_id": event["pathParameters"]["thread_id"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return delete_thread(**params)
