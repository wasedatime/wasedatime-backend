import json
from datetime import datetime

from utils import JsonPayloadBuilder, translate_text, langs, table, resp_handler


def post_review(key, review, uid):
    text = review["comment"]

    src_lang, translated = translate_text(text)

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    review_item = {
        "title_jp": review["title_jp"],
        "instructor_jp": review["instructor_jp"],
        "created_at": dt_now,
        "updated_at": dt_now,
        "benefit": review["benefit"],
        "difficulty": review["difficulty"],
        "satisfaction": review["satisfaction"],
        "instructor": review["instructor"],
        "year": review["year"],
        "src_lang": src_lang,
        "course_key": key,
        "title": review["title"],
        "uid": uid
    }
    for l in langs:
        translation = translated[l]
        review_item[f'comment_{l}'] = translation

    table.put_item(Item=review_item)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    headers = event["headers"]

    req = json.loads(event['body'])
    params = {
        "key": event["pathParameters"]["key"],
        "review": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return resp_handler(func=post_review, params=headers)(**params)
