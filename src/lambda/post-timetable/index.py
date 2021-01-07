import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def post_timetable(uid, content):
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    content["created_at"] = dt_now
    content["updated_at"] = dt_now
    content["uid"] = uid
    table.put_item(Item=content)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "content": req["data"]
    }

    return post_timetable(**params)
