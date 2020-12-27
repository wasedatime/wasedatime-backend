import json
from datetime import datetime

from utils import bad_referer, JsonPayloadBuilder, api_response, translate_text, langs, table


def post_review(review):
    text = review["comment"]

    translated = translate_text(text)
    src_lang = translated['src']

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ')

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
        f"comment_{src_lang}": text,
        "src_lang": src_lang,
        "course_key": review["course_key"],
        "title": review["title"],
        "uid": review["uid"]
    }
    for l in langs:
        review_item[f'comment_{l}'] = translated[l]

    table.put_item(Item=review_item)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    if bad_referer(event["headers"]):
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("External request detected, related information will be reported to admin.").compile()
        return api_response(403, resp)

    req = json.loads(event['body'])
    # todo verify user
    # token = req["token"]

    review = req["data"]

    try:
        resp = post_review(review)
        return api_response(200, resp)
    except Exception:
        resp = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, resp)
