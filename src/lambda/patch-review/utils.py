import base64
import boto3
import json
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


def bad_referer(headers):
    if "referer" not in headers:
        return True
    elif fullmatch(r'https://(\w+\.|)wasedatime\.com/.*', headers["referer"]) is None:
        return True
    else:
        return False


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