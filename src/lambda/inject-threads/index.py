from datetime import datetime, timedelta
from utils import JsonPayloadBuilder, resp_handler, get_bedrock_response


def handler(event, context):
    resp = get_bedrock_response()

    print(resp)
