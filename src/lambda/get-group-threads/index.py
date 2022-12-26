from boto3.dynamodb.conditions import Key, Attr
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_group_threads(board_id, group_id, tag_id):

    results = table.query(KeyConditionExpression=Key(
        "board_id").eq(board_id),
        IndexName=group_id,
        FilterExpression=Attr('tag_id').eq(tag_id))["Items"]
    if not results:
        raise LookupError

    body = JsonPayloadBuilder().add_status(
        True).add_data(results).add_message('').compile()
    return body


def handler(event, context):

    params = {
        "board_id": event["queryStringParameters"]["board_id"],
        "group_id": event["queryStringParameters"]["group_id"],
        "tag_id": event["queryStringParameters"]["tag_id"]
    }

    return get_group_threads(**params)
