from boto3.dynamodb.conditions import Attr

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def delete_comment(thread_id, ts, uid):
    table.delete_item(
        Key={
            "thread_id": thread_id,
            "created_at": ts
        },
        ConditionExpression=Attr('uid').eq(uid)
    )

    resp_body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return resp_body


def handler(event, context):
    params = {
        "thread_id": event["pathParameters"]["thread_id"],
        "ts": event["queryStringParameters"]["ts"],
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return delete_comment(**params)
