import json
from datetime import datetime

from utils import bad_referer, JsonPayloadBuilder, api_response, translate_text, client, parent, langs, table


def post_review(review):
    text = review["comment"]

    lang = client.detect_language(parent, content=text).languages[0].language_code
    langs.remove(lang)
    translated = translate_text(text, lang, langs)

    review_item = {
        "title_jp": review["title_jp"],
        "instructor_jp": review["instructor_jp"],
        "created_at": datetime.now().timestamp(),
        "updated_at": '',
        "benefit": review["benefit"],
        "difficulty": review["difficulty"],
        "satisfaction": review["satisfaction"],
        "instructor": review["instructor"],
        "year": review["instructor"],
        f"comment_{lang}": text,
        "comment_src_lng": lang,
        "course_key": review["course_key"],
        "title": review["title"],
        "uid": review["uid"]
    }
    for l in langs:
        review_item[f'comment_{l}'] = translated[l]

    try:
        table.put_item(Item=review_item)
    except Exception:
        body = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("Internal error, please contact admin@wasedatime.com.").compile()
        return api_response(500, body)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return api_response(200, body)


def handler(event, context):
    if bad_referer(event["headers"]):
        body = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("External request detected, related information will be reported to admin.").compile()
        return api_response(403, body)
    return post_review(json.loads(event['body']))
