from boto3.dynamodb.conditions import Key
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_thread(thread_id):

    results = table.query(KeyConditionExpression=Key(
        "thread_id").eq(thread_id))["Items"]
    if not results:
        raise LookupError

    item = results[0]

    body = JsonPayloadBuilder().add_status(
        True).add_data(item).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "thread_id": event["pathParameters"]["thread_id"]
    }

    return get_thread(**params)
