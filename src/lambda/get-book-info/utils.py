import boto3
import json
import logging
from decimal import Decimal
from urllib import parse
from urllib import request

comprehend = boto3.client(service_name='comprehend', region_name='ap-northeast-1')


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


def detect_lang(s):
    if s.isascii():
        return 'en'
    return 'ja'


def build_queries(text):
    cnt = 0
    books_queries = []
    entities = comprehend.detect_entities(Text=text, LanguageCode=detect_lang(text))["Entities"]
    for e in entities:
        if e['Type'] == 'TITLE' and e['Score'] >= 0.83:
            if cnt == 0:
                books_queries.append(f"+intitle:{e['Text']}")
                cnt += 1
            else:
                cnt -= 1
                books_queries[-1] += f"+intitle:{e['Text']}"
        if e['Type'] == 'PERSON' and e['Score'] >= 0.83:
            if cnt == 0:
                books_queries.append(f"+inauthor:{e['Text']}")
                cnt += 1
            else:
                cnt -= 1
                books_queries[-1] += f"+inauthor:{e['Text']}"
    return books_queries


def get_books(queries):
    results = []
    for q in queries:
        url = "https://www.googleapis.com/books/v1/volumes?q=" + parse.quote(q)
        req = request.Request(url=url)
        resp = json.loads(request.urlopen(req).read())
        if resp["totalItems"] == 0:
            continue
        link = resp["items"][0]["selfLink"]
        req = request.Request(url=link)
        info = json.loads(request.urlopen(req).read())
        vol_info = info["volumeInfo"]
        results.append({
            "title": vol_info["title"],
            "authors": vol_info["authors"],
            "publisher": vol_info["publisher"],
            "thumbnail": vol_info["imageLinks"]["thumbnail"],
            "link": f"https://www.google.co.jp/books/edition/volume/{info['id']}"
        })
    return results
