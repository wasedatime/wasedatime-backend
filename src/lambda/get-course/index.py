from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder, resp_handler, table


@resp_handler
def get_reviews(id):
    results = table.query(KeyConditionExpression=Key("id").eq(id), ScanIndexForward=False)["Items"]
    if not results:
        raise LookupError
    data = results[0]
    data.pop("ttl")

    body = JsonPayloadBuilder().add_status(True).add_data(results).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "id": event["queryStringParameters"]["id"]
    }

    return get_reviews(**params)
