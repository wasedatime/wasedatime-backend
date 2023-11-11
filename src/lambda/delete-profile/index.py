from boto3.dynamodb.conditions import Attr
import boto3

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def delete_profile(uid):

    table.delete_item(
        Key={
            "uid": uid,
        },
        ConditionExpression=Attr('uid').eq(uid)
    )

    resp_body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return resp_body


def handler(event, context):
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }
    
    delete_profile(**params)