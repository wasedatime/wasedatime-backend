import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def patch_timetable(uid, content):
    for c in content:
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        c["updated_at"] = dt_now
        c["uid"] = uid
        table.put_item(Item=c)

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "content": req["data"]
    }

    return patch_timetable(**params)
