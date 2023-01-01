import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table


@resp_handler
def patch_thread(board_id, ts, thread_id, thread):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    table.update_item(
        Key={
            "board_id": board_id,
            "created_at": ts,
        },
        UpdateExpression='SET courses = :info, update_at = :ts',
        ExpressionAtrributeValues={
            ":info": [body['courses']],
            ":ts": dt_now
        }
    )

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "board_id": event["pathParameters"]["board_id"],
        "thread_id": event["pathParameters"]["thread_id"],
        "ts": event["queryStringParameters"]["ts"],
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "thread": req["data"]
    }

    return patch_thread(**params)
