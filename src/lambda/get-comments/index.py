from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table


@resp_handler
def get_comments(thread_id, uid=""):
    results = table.query(KeyConditionExpression=Key(
        "thread_id").eq(thread_id), ScanIndexForward=True)["Items"]
    for r in results:
        r["mod"] = False
        if r["uid"] == uid:
            r["mod"] = True
        del r["uid"]

    body = JsonPayloadBuilder().add_status(
        True).add_data(results).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "thread_id": event["pathParameters"]["thread_id"],
    }
    if "uid" in event["queryStringParameters"]:
        params["uid"] = event["queryStringParameters"]["uid"]

    return get_comments(**params)
