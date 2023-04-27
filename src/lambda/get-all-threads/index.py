from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_all_threads():

    response = table.scan(TableName=table, Limit=50)
    items = response['Items']

    body = JsonPayloadBuilder().add_status(
        True).add_data(items).add_message('').compile()
    return body


def handler(event, context):

    return get_all_threads()
