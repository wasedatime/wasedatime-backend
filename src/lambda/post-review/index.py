import json
import logging
from datetime import datetime

from utils import JsonPayloadBuilder, api_response, translate_text, langs, table


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
    # if bad_referer(headers):
    #     logging.warning(f"External Request from {headers['X-Forwarded-For']}:headers['X-Forwarded-Port']")
    #     resp = JsonPayloadBuilder().add_status(False).add_data(None) \
    #         .add_message("External request detected, related information will be reported to admin.").compile()
    #     return api_response(403, resp)

    req = json.loads(event['body'])

    key = event["pathParameters"]["key"]
    review = req["data"]
    uid = event['requestContext']['authorizer']['claims']['sub']

    try:
        resp = post_review(key, review, uid)
        return api_response(200, resp)
    except Exception as e:
        logging.error(str(e))
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, resp)
