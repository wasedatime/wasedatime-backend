import json
import os

import boto3
from google.cloud import translate

from utils import bad_referer, JsonPayloadBuilder, api_response

db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))
client = translate.TranslationServiceClient()

langs = ['en', 'zh-CN', 'jp', 'zh-TW', 'ko']
parent = "projects/wasedatime/locations/global"


def translate_text(text, src_lang, target_langs):
    results = dict()
    for lang in target_langs:
        response = client.translate_text(
            parent=parent,
            contents=[text],
            mime_type="text/plain",
            source_language_code=src_lang,
            target_language_code=lang)
        results[lang] = response

    return results


def put_review(review):
    text = review["comment"]

    lang = client.detect_language(parent, content=text).languages[0].language_code
    langs.remove(lang)
    translated = translate_text(text, lang, langs)

    # review_item = {
    #     "title_jp": review["title_jp"],
    #     "instructor_jp": review["instructor_jp"],
    #     "created_at": datetime.now().timestamp(),
    #     "updated_at": '',
    #     "benefit": review["benefit"],
    #     "difficulty": review["difficulty"],
    #     "satisfaction": review["satisfaction"],
    #     "instructor": review["instructor"],
    #     "year": review["instructor"],
    #     f"comment_{lang}": text,
    #     "comment_src_lang": lang,
    #     "course_key": review["course_key"],
    #     "title": review["title"],
    #     "uid": review["uid"]
    # }
    # for l in langs:
    #     review_item[f'comment_{l}'] = translated[l]
    #
    # try:
    #     table.put_item(Item=review_item)
    # except Exception:
    #     body = JsonPayloadBuilder().add_status(False).add_data(None) \
    #         .add_message("Internal error, please contact admin@wasedatime.com.").compile()
    #     return api_response(500, body)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return api_response(200, body)


def lambda_handler(event, context):
    if bad_referer(event["headers"]):
        body = JsonPayloadBuilder().add_status(False).add_data(None) \
            .add_message("External request detected, related information will be reported to admin.").compile()
        return api_response(403, body)
    return put_review(json.loads(event['body']))
