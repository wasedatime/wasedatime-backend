import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def patch_timetable(uid, content):
    op = content.pop("operation")
    if op == "remove":
        i = content.pop("index")
        expr = f'REMOVE courses[{i}]'
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        content["updated_at"] = dt_now
        table.update_item(
            Key={
                "uid": uid
            },
            UpdateExpression=expr
        )
    else:
        expr = f'SET courses = list_append(courses, :info)'
        val = {":info": [content["course"]]}
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        content["updated_at"] = dt_now
        table.update_item(
            Key={
                "uid": uid
            },
            UpdateExpression=expr,
            ExpressionAttributeValues=val
        )

    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "content": req["data"]
    }

    return patch_timetable(**params)
