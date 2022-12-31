from boto3.dynamodb.conditions import Attr

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def delete_thread(key, ts, uid):
    table.delete_item(
        Key={
            "course_key": key,
            "created_at": ts
        },
        ConditionExpression=Attr('uid').eq(uid)
    )

    resp_body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return resp_body


def handler(event, context):
    params = {
        "key": event["pathParameters"]["thread_id"],
        "ts": event["queryStringParameters"]["ts"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return delete_thread(**params)
