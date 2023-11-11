import base64
import boto3
import json
import logging
import os
from decimal import Decimal
from datetime import datetime, timezone

# AWS DynamoDB Resources
db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))
userpool_id = os.getenv('AWS_USER_POOL_ID'),

# cognito client use to extract user created time
cognito_client = boto3.client('cognito-idp')

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


def resp_handler(func=None, headers=None):
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

def extract_and_format_date(event):
    try:
        identities_str = event['requestContext']['authorizer']['claims']['identities']
        
        # Debug print to see the identities string
        print("Identities String:", identities_str)

        identities = json.loads(identities_str)
        
        date_created_at = identities.get("dateCreated")
        formatted_time = format_time(date_created_at)
        
        return formatted_time

    except Exception as e:
        print(f"Error in extract_and_format_date: {e}")
        return None

def format_time(timestamp_ms):
    timestamp_s = timestamp_ms / 1000.0
    dt = datetime.fromtimestamp(timestamp_s, tz=timezone.utc)
    return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'