import json
from boto3.dynamodb.conditions import Attr
from datetime import datetime

from utils import JsonPayloadBuilder, translate_text, langs, table, resp_handler


def patch_review(key, ts, review, uid):
    resp_body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()

    if "comment" not in review:
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        table.update_item(
            Key={
                "course_key": key,
                "created_at": ts
            },
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

    expr_attr_name = dict()
    expr_attr_val = dict()

    for l in langs:
        expr_attr_name[f'#{l[-2:]}'] = f'comment_{l}'
        expr_attr_val[f':{l[-2:]}'] = translated[l]
    expr_attr_val[":src"] = src_lang

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    expr_attr_val[":ts"] = dt_now
    expr_attr_val[":ben"] = review["benefit"]
    expr_attr_val[":diff"] = review["difficulty"]
    expr_attr_val[":sat"] = review["satisfaction"]

    table.update_item(
        Key={
            "course_key": key,
            "created_at": ts
        },
        UpdateExpression="SET updated_at = :ts, benefit = :ben, difficulty = :diff, satisfaction = :sat, "
                         "#en = :en, #CN = :CN, #TW = :TW, #ja = :ja, #ko = :ko, src_lang = :src",
        ExpressionAttributeNames=expr_attr_name,
        ExpressionAttributeValues=expr_attr_val
    )

    return resp_body


def handler(event, context):
    headers = event["headers"]
    req = json.loads(event['body'])

    params = {
        "key": event["pathParameters"]["key"],
        "create_time": event["queryStringParameters"]["ts"],
        "review": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return resp_handler(func=patch_review, params=headers)(**params)
