from boto3.dynamodb.conditions import Key

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_timetable(uid):
    result = table.query(KeyConditionExpression=Key("uid").eq(uid))["Items"]
    if not result:
        raise LookupError
    for r in result:
        r.pop("uid")

    body = JsonPayloadBuilder().add_status(True).add_data(result).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return get_timetable(**params)
