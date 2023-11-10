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
    if "uid" in event["queryStringParameters"]:
        uid = event["queryStringParameters"]["uid"]

        return get_profile(uid)
    
    else:
        logging.error("Failed to fetch user profile")