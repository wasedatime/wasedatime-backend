import aiohttp
import asyncio
import boto3
import json
import logging
from decimal import Decimal
from urllib import parse

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


def parse_linefeed_offset(text):
    linefeed_offset = []
    for index, ch in enumerate(text):
        if ch == '\n':
            linefeed_offset.append(index)
    linefeed_offset.append(len(text))
    return linefeed_offset


def build_queries(text):
    cnt = 0
    line_index = 0

    books_queries = []
    entities = comprehend.detect_entities(Text=text, LanguageCode=detect_lang(text))["Entities"]
    # get offset of all of linefeed character and end with the length of text
    linefeed_offset = parse_linefeed_offset(text)
    # suppose we only have one query per line
    query_info = ""
    organization = ""
    for e in entities:
        if (e['EndOffset'] > linefeed_offset[line_index]):
            while (e['EndOffset'] > linefeed_offset[line_index]):
                line_index += 1

            if (cnt == 0 or cnt == 2) and len(organization) != 0:
                query_info += "+intitle:" + organization

            if len(query_info) > 0:
                books_queries.append(query_info)
            query_info = ""
            organization = ""
            cnt = 0

        if e['Type'] == 'TITLE' and e['Score'] >= 0.83:
            if cnt == 0 or cnt == 2:
                query_info += f"+intitle:{e['Text']}"
                cnt += 1
            elif cnt == 1 or cnt == 3:
                books_queries.append(query_info)
                cnt = 0
                query_info = ""
                organization = ""

        if e['Type'] == 'PERSON' and e['Score'] >= 0.83:
            if cnt == 0 or cnt == 1:
                query_info += f"+inauthor:{e['Text']}"
                cnt += 2

        if e['Type'] == "ORGANIZATION" and len(organization) == 0:
            organization = e['Text']

    return books_queries


def get_books(queries):
    async def async_get(url):
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as query_resp:
                query_resp = await query_resp.json()
                if query_resp["totalItems"] == 0:
                    return None
                link = query_resp["items"][0]["selfLink"]
            async with session.get(link) as item_resp:
                info = await item_resp.json()
                vol_info = info["volumeInfo"]
                try:
                    thumbnail = vol_info["imageLinks"]["thumbnail"]
                except LookupError:
                    thumbnail = ""
                return {
                    "title": vol_info["title"],
                    "authors": vol_info.get("authors", []),
                    "publisher": vol_info.get("publisher", []),
                    "thumbnail": thumbnail,
                    "link": f"https://www.google.co.jp/books/edition/volume/{info['id']}"
                }

    async def batch_request():
        tasks = []
        for q in queries:
            url = "https://www.googleapis.com/books/v1/volumes?q=" + parse.quote(q)
            tasks.append(async_get(url))
        return await asyncio.gather(*tasks)

    loop = asyncio.get_event_loop()
    resp = loop.run_until_complete(batch_request())
    return [r for r in resp if r]
