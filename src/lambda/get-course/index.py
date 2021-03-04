from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import scrape_course


@resp_handler
def get_course(id):
    result = scrape_course(id)
    if not result:
        raise LookupError

    body = JsonPayloadBuilder().add_status(True).add_data(result).add_message('').compile()
    return body


def handler(event, context):
    params = {
        "id": event["queryStringParameters"]["id"]
    }

    return get_course(**params)
