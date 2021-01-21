from utils import JsonPayloadBuilder, resp_handler, table


@resp_handler
def get_reviews(id):
    result = table.get_item(Key={"id": id})["Item"]
    if not result:
        raise LookupError
    result.pop("ttl")

    body = JsonPayloadBuilder().add_status(True).add_data(result).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "id": event["queryStringParameters"]["id"]
    }

    return get_reviews(**params)
