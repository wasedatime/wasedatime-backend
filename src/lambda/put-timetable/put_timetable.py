import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table


@resp_handler

def put_timetable(uid, content):
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    table.update_item(
        Key = {
            "uid": uid
        },
        UpdateExpression = 'SET courses = :info, update_at = :ts',
        ExpressionAtrributeValues = {
            ":info" : [content['courses']],
            ":ts" : dt_now
        }
    )
    
    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "content": req["data"]
    }

    return put_timetable(**params)   