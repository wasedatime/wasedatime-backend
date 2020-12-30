import json
import logging
from datetime import datetime

from utils import JsonPayloadBuilder, api_response, translate_text, langs, table


def patch_review(key, ts, review):
    resp_body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()

    if "comment" not in review:
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        table.update_item(
            Key={
                "course_key": key,
                "created_at": ts
            },
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

    expr_attr_name = {}
    expr_attr_val = {}
    for l in langs:
        expr_attr_name[f'#{l[-2:]}'] = f'comment_{l}'
        expr_attr_val[f':{l[-2:]}'] = translated[l]
    expr_attr_val[":src"] = src_lang

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    expr_attr_val[":ts"] = dt_now
    expr_attr_val[":ben"] = review["benefit"],
    expr_attr_val[":diff"] = review["difficulty"],
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
    # if bad_referer(headers):
    #     logging.warning(f"External Request from {headers['X-Forwarded-For']}:headers['X-Forwarded-Port']")
    #     resp = JsonPayloadBuilder().add_status(False).add_data(None) \
    #         .add_message("External request detected, related information will be reported to admin.").compile()
    #     return api_response(403, resp)

    req = json.loads(event['body'])

    key = event["pathParameters"]["key"]
    create_time = event["queryStringParameters"]["ts"]
    review = req["data"]
    uid = event['requestContext']['authorizer']['claims']['sub']

    try:
        resp = patch_review(key, create_time, review)
        return api_response(200, resp)
    except Exception as e:
        logging.error(str(e))
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, resp)


if __name__ == '__main__':
    review = {
        "benefit": 5,
        "comment": "This is a nice course! you can learn practical experience",
        "difficulty": 5,
        "satisfaction": 5
    }
    resp = patch_review('26GF02200201', '2020-12-30T14:58:25.221Z', review)
