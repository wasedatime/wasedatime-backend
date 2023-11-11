from encodings import utf_8
from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table
import logging


@resp_handler
def get_profile(uid):
    response = table.query(KeyConditionExpression=Key(
        "uid").eq(uid), ScanIndexForward=True)["Items"]
    
    item = response[0]

    body = JsonPayloadBuilder().add_status(
        True).add_data(item).add_message('').compile()
    return body


def handler(event, context):
        
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }
    
    return get_profile(**params)