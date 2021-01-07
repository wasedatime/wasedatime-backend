from boto3.dynamodb.conditions import Key

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_timetable(uid):
    results = table.query(KeyConditionExpression=Key("uid").eq(uid))["Items"]
    if not results:
        raise LookupError
    data = results[0]
    data.pop("uid")

    body = JsonPayloadBuilder().add_status(True).add_data(data).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }

    return get_timetable(**params)
