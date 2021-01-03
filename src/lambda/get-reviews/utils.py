import json
import logging
from decimal import Decimal
from re import fullmatch


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
