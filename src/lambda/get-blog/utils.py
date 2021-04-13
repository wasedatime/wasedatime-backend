import functools
import boto3
import json
import logging
from decimal import Decimal
from urllib import parse

dynamodb = boto3.resource('dynamodb')
table    = dynamodb.Table('blogs')

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

def compare(A,B):
    if A['update_at'] < B['update_at']:
        return -1
    elif A['update_at'] > B['update_at']:
        return 1
    if A['update_at'] == B['update_at']:
        return 0

def ret_dic(indexes,cnt):
    return {
        "articles" : indexes,
        "size" : cnt        
    }

def get_blogs(offset,limit):
    done = False
    start_key = False
    data = []
    scan_args = []

    while not done:
        if(start_key):
            scan_args['ExclusiveStartKey'] = start_key
        response = table.scan(**scan_args)
        data = data + response.get('Items',[])
        start_key = response.get('LastEvaluatedKey', None)
        done = start_key is None

    data.sort(key=functools.cmp_to_key(compare))
    indexes = []
    cnt = 0

    for i in range(offset,len(data)):
        indexes.append(data[i])
        cnt+=1

    return ret_dic(indexes,cnt)

