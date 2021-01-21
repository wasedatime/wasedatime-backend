import base64
import boto3
import json
import logging
import os
from decimal import Decimal
from google.cloud import translate
from google.oauth2 import service_account

# AWS DynamoDB Resources
db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))

# Google Translation client and configs
acct_info = json.loads(base64.b64decode(os.environ.get('GOOGLE_API_SERVICE_ACCOUNT_INFO')))
credentials = service_account.Credentials.from_service_account_info(acct_info)
client = translate.TranslationServiceClient(credentials=credentials)
parent = "projects/wasedatime/locations/global"

# Supported languages
langs = ['en', 'ja', 'ko', 'zh-CN', 'zh-TW']


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


class JsonPayloadBuilder:
    payload = {}

    def add_status(self, success):
        self.payload['success'] = success
        return self

    def add_data(self, data):
        self.payload['data'] = data
        return self

    def add_message(self, msg):
        self.payload['message'] = msg
        return self

    def compile(self):
        return json.dumps(self.payload, cls=DecimalEncoder, ensure_ascii=False).encode('utf8')


def api_response(code, body):
    return {
        "isBase64Encoded": False,
        "statusCode": code,
        'headers': {
            "Access-Control-Allow-Origin": '*',
            "Content-Type": "application/json",
            "Referrer-Policy": "origin"
        },
        "multiValueHeaders": {"Access-Control-Allow-Methods": ["POST", "OPTIONS", "GET", "PATCH", "DELETE"]},
        "body": body
    }


def resp_handler(func):
    def handle(*args, **kwargs):
        try:
            resp = func(*args, **kwargs)
            return api_response(200, resp)
        except LookupError:
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Not found").compile()
            return api_response(404, resp)
        except Exception as e:
            logging.error(str(e))
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Internal error, please contact bugs@wasedatime.com.").compile()
            return api_response(500, resp)

    return handle


def translate_text(text):
    src_lang = client.detect_language(request={
        "parent": parent,
        "content": text,
        "mime_type": "text/plain"
    }).languages[0].language_code

    translations = {}

    for lang in langs:
        if lang == src_lang:
            translations[lang] = text
            continue

        translated = client.translate_text(request={
            "parent": parent,
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": src_lang,
            "target_language_code": lang
        }).translations[0].translated_text

        translations[lang] = translated or ''

    return src_lang, translations


def format_update_expr(src_lang, translated, review, dt_now):
    expr_attr_name = dict()
    expr_attr_val = dict()

    for l in langs:
        expr_attr_name[f'#{l[-2:]}'] = f'comment_{l}'
        expr_attr_val[f':{l[-2:]}'] = translated[l]
    expr_attr_val[":src"] = src_lang
    expr_attr_val[":ts"] = dt_now
    expr_attr_val[":ben"] = review["benefit"]
    expr_attr_val[":diff"] = review["difficulty"]
    expr_attr_val[":sat"] = review["satisfaction"]

    expr = "SET updated_at = :ts, benefit = :ben, difficulty = :diff, satisfaction = :sat, " \
           "#en = :en, #CN = :CN, #TW = :TW, #ja = :ja, #ko = :ko, src_lang = :src"
    return expr, expr_attr_name, expr_attr_val
