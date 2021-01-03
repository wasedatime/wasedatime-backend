import base64
import boto3
import json
import logging
import os
from decimal import Decimal
from google.cloud import translate
from google.oauth2 import service_account
from re import fullmatch

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
        "multiValueHeaders": {"Access-Control-Allow-Methods": ["POST", "OPTIONS", "GET", "PUT"]},
        "body": body
    }


def resp_handler(func=None, headers=None):
    def handle(*args, **kwargs):
        if "referer" not in headers or fullmatch(r'https://(\w+\.|)wasedatime\.com/.*', headers["referer"]) is None:
            logging.warning(f"External Request from {headers['X-Forwarded-For']}:headers['X-Forwarded-Port']")
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("External request detected, related information will be reported to admin.").compile()
            return api_response(403, resp)
        else:
            try:
                resp = func(*args, **kwargs)
                return api_response(200, resp)
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
