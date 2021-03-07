import json
from utils import JsonPayloadBuilder
from utils import build_queries
from utils import get_books
from utils import resp_handler


@resp_handler
def analyze_book(text):
    queries = build_queries(text)
    books = get_books(queries)
    resp_body = JsonPayloadBuilder().add_status(True).add_data(books).add_message('').compile()
    return resp_body


def handler(event, context):
    body = json.loads(event['body'])
    params = {
        "text": body["data"]
    }

    return analyze_book(**params)
