from boto3.dynamodb.conditions import Key
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler, s3_client, bucket, generate_url


@resp_handler
def get_career(job_type):

    if job_type:
        response = table.query(
            KeyConditionExpression=Key('type').eq(job_type)
        )
    else:
        response = table.scan()

    items = response.get('Items', [])

    for item in items:
        image_keys = item.get('image_object_keys', [])
        item['image_urls'] = [generate_url(
            bucket, key) for key in image_keys]

    body = JsonPayloadBuilder().add_status(
        True).add_data(response).add_message().compile()

    return body


def handler(event, context):

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        job_type = params.get("type", "")

    return get_career(job_type)
