import email
import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def post_profile(profile, uid):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    user_profile = {
        "uid": uid,
        "name" : profile["name"],
        "email" : profile["email"],
        "year" : profile["year"],
        "class_of" : profile["class_of"],
        "languages" : profile["languages"],
        "interests" : profile["interests"],
        "school" : profile["school"],
        "created_at": dt_now,
        "updated_at": dt_now,
    }
    table.put_item(Item=user_profile)

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "profile": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return post_profile(**params)