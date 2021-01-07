import json
from boto3.dynamodb.conditions import Attr
from datetime import datetime

from utils import JsonPayloadBuilder, translate_text, format_update_expr, table, resp_handler


@resp_handler
def patch_review(key, ts, review, uid):
    resp_body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    primary_key = {
        "course_key": key,
        "created_at": ts
    }

    if "comment" not in review:
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        table.update_item(
            Key=primary_key,
            ConditionExpression=Attr('uid').eq(uid),
            UpdateExpression="SET updated_at = :ts, benefit = :ben, difficulty = :diff, satisfaction = :sat",
            ExpressionAttributeValues={
                ":ts": dt_now,
                ":ben": review["benefit"],
                ":diff": review["difficulty"],
                ":sat": review["satisfaction"]
            }
        )
        return resp_body

    text = review["comment"]
    src_lang, translated = translate_text(text)

    expr, expr_attr_name, expr_attr_val = format_update_expr(src_lang, translated, review)
    table.update_item(
        Key=primary_key,
        ConditionExpression=Attr('uid').eq(uid),
        UpdateExpression=expr,
        ExpressionAttributeNames=expr_attr_name,
        ExpressionAttributeValues=expr_attr_val
    )

    return resp_body


def handler(event, context):
    req = json.loads(event['body'])

    params = {
        "key": event["pathParameters"]["key"],
        "create_time": event["queryStringParameters"]["ts"],
        "review": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return patch_review(**params)
