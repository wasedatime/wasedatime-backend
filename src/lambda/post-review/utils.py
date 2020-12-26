import base64
import json
import os
from decimal import Decimal
from re import fullmatch

import boto3
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
langs = ['en', 'zh-CN', 'jp', 'zh-TW', 'ko']


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


# todo verify the user using jwt token

def verify_user():
    pass


def bad_referer(headers):
    if "referer" not in headers:
        return True
    elif fullmatch(r'https://(\w+\.|)wasedatime\.com/.*', headers["referer"]) is None:
        return True
    else:
        return False


def translate_text(text, src_lang, target_langs):
    results = dict()
    for lang in target_langs:
        response = client.translate_text(
            parent=parent,
            contents=[text],
            mime_type="text/plain",
            source_language_code=src_lang,
            target_language_code=lang)
        results[lang] = response.translations[0].translated_text

    return results
