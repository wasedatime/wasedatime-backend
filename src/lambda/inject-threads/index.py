from datetime import datetime, timedelta
from utils import JsonPayloadBuilder, resp_handler, generate_prompt

import boto3
import botocore


def handler(event, context):
    print('botocore vertion: {0}'.format(botocore.__version__))
    print('boto3 vertion: {0}'.format(boto3.__version__))
