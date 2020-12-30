import boto3
import os
from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder, api_response

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
    # if bad_referer(event["headers"]):
    #     resp = JsonPayloadBuilder().add_status(False).add_data(None) \
    #         .add_message("External request detected, related information will be reported to admin.").compile()
    #     return api_response(403, resp)

    course_key = event["pathParameters"]["key"]
    uid = event["queryStringParameters"]["uid"]

    try:
        resp = get_reviews(course_key, uid)
        return api_response(200, resp)
    except Exception:
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, resp)
