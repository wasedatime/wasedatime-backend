import json
import os

import boto3
from boto3.dynamodb.conditions import Key

from utils import JsonPayloadBuilder, api_response, bad_referer

db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))


def get_reviews(course_key, uid):
    try:
        results = table.query(KeyConditionExpression=Key("course_key").eq(course_key))["Items"]
    except Exception:
        body = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, body)

    for r in results:
        r["mod"] = False
        if r["uid"] == uid:
            r["mod"] = True
        del r["uid"]

    body = JsonPayloadBuilder().add_status(True).add_data(results).add_message('').compile()
    return api_response(200, body)


def handler(event, context):
    if bad_referer(event["headers"]):
        body = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("External request detected, related information will be reported to admin.").compile()
        return api_response(403, body)

    course_key = json.loads(event["queryStringParameters"])["key"]
    uid = json.loads(event["queryStringParameters"])["uid"]
    return get_reviews(course_key, uid)
