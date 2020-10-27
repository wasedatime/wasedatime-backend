import json
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal
from re import fullmatch

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)

def bad_referer(headers):
    if "referer" not in headers:
        return True
    elif fullmatch('https:\/\/(dev\.|www\.)*wasedatime\.com\/.*', headers["referer"]) == None:
        return True
    else:
        return False

def handler(event, context):
    if bad_referer(event["headers"]):
        return {
            "statusCode": 403,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": '{"success":false,"data":null,"message":"External request detected, related information will be reported to admin."}'
        }
    try:
        db = boto3.resource("dynamodb", region_name="ap-northeast-1")
        table = db.Table("CourseReview")
        course_keys = json.loads(event["body"])["course_keys"]
    except Exception:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": '{"success":false,"data":null,"message":"Sorry, our service is temporarily unavailable."}'
        }

    results = []
    for key in course_keys:
        comments = dict()
        comments["course_key"] = key
        query_response = table.query(
            KeyConditionExpression=Key("course_key").eq(key)
        )
        comments["comments"] = query_response["Items"]
        results.append(comments)
    api_response = {"success": True, "data": results}
    return {
        "isBase64Encoded": False,
        'statusCode': 200,
        'headers': {
            "Content-Type": "application/json",
            "Referrer-Policy": "origin"
        },
        "multiValueHeaders":{"Access-Control-Allow-Methods": ["POST","OPTIONS","GET"]},
        'body': json.dumps(api_response, cls=DecimalEncoder, ensure_ascii=False).encode('utf8')
    }
