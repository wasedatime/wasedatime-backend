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
    params = {
        "offset": int(event["queryStringParameters"]["offset"]),
        "limit" : int(event["queryStringParameters"]["limit"])
    }

    return query_blogs(**params)