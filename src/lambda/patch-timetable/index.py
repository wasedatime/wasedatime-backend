import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table


@resp_handler
def patch_timetable(uid, content):
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    op = content.pop("operation")
    if op == "remove":
        i = content.pop("index")
        table.update_item(
            Key={
                "uid": uid
            },
            UpdateExpression='REMOVE #courses[:index] SET #updated_at = :time',
            ExpressionAttributeValues={
                ":index": i,
                ":time": dt_now
            },
            ExpressionAttributeNames={
                '#courses': 'courses',
                '#updated_at': 'updated_at'
            }
        )
    else:
        dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
        table.update_item(
            Key={
                "uid": uid
            },
            UpdateExpression='SET #courses = list_append(#courses, :info), #updated_at = :time',
            ExpressionAttributeValues={
                ":info": [content["course"]],
                ":time": dt_now
            },
            ExpressionAttributeNames={
                '#courses': 'courses',
                '#updated_at': 'updated_at'
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

    return patch_timetable(**params)