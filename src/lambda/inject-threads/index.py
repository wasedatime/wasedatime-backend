from datetime import datetime, timedelta
from utils import JsonPayloadBuilder, resp_handler, generate_prompt


def handler(event, context):
    generate_prompt()
