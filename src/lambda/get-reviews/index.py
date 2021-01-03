import boto3
import os
from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder, resp_handler

db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))


def get_reviews(course_key, uid):
    results = table.query(KeyConditionExpression=Key("course_key").eq(course_key), ScanIndexForward=False)["Items"]
    for r in results:
        r.pop("course_key")
        r["benefit"] = int(r["benefit"])
        r["difficulty"] = int(r["difficulty"])
        r["satisfaction"] = int(r["satisfaction"])
        r["year"] = int(r["year"])
        r["mod"] = False
        if r["uid"] == uid:
            r["mod"] = True
        del r["uid"]

    body = JsonPayloadBuilder().add_status(True).add_data(results).add_message('').compile()
    return body


def handler(event, context):
    headers = event["headers"]
    params = {
        "course_key": event["pathParameters"]["key"],
        "uid": event["queryStringParameters"]["uid"]
    }

    return resp_handler(func=get_reviews, headers=headers)(**params)
