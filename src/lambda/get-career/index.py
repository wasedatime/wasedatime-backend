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
        hero_image_keys = item.get('hero_image', [])
        company_logo_keys = item.get('compnay_logo', [])
        item['hero_image_urls'] = [generate_url(
            bucket, key) for key in hero_image_keys]
        item['company_logo_urls'] = [generate_url(
            bucket, key) for key in company_logo_keys]

    body = JsonPayloadBuilder().add_status(
        True).add_data(response).add_message("").compile()

    return body


def handler(event, context):

    if "queryStringParameters" in event:
        params = event["queryStringParameters"]
        job_type = params.get("type", "")

    return get_career(job_type)
