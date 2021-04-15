import json
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import get_blogs

@resp_handler
def query_blogs(offset,limit):
    blogs = get_blogs(offset,limit)
    resp_body = JsonPayloadBuilder().add_status(True).add_data(blogs).add_message('').compile()
    return resp_body

def handler(event, context):
    body = json.loads(event['body'])
    params = {
        "offset": body["offset"],
        "limit" : body["limit"]
    }

    return query_blogs(**params)