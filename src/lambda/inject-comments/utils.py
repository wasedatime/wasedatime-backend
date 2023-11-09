from concurrent.futures import thread
import boto3
import json
import logging
import os
from decimal import Decimal
from datetime import datetime
import uuid
from boto3.dynamodb.conditions import Key
import random
import re

db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table_thread = db.Table(os.getenv('THREAD_TABLE_NAME'))
table_comment = db.Table(os.getenv('COMMENT_TABLE_NAME'))

UID = os.getenv('UID')

UNIV_ID = "1"

bedrock_client = boto3.client('bedrock-runtime', region_name='ap-northeast-1')


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


class ExtendedEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, set):
            return list(obj)
        return super(ExtendedEncoder, self).default(obj)


class JsonPayloadBuilder:
    payload = {}

    def add_status(self, success):
        self.payload['success'] = success
        return self

    def add_data(self, data):
        self.payload['data'] = data
        return self

    def add_message(self, msg):
        self.payload['message'] = msg
        return self

    def compile(self):
        return json.dumps(self.payload, cls=ExtendedEncoder, ensure_ascii=False).encode('utf8')


def api_response(code, body):
    return {
        "isBase64Encoded": False,
        "statusCode": code,
        'headers': {
            "Access-Control-Allow-Origin": '*',
            "Content-Type": "application/json",
            "Referrer-Policy": "origin"
        },
        "multiValueHeaders": {"Access-Control-Allow-Methods": ["POST", "OPTIONS", "GET", "PATCH", "DELETE"]},
        "body": body
    }


def resp_handler(func):
    def handle(*args, **kwargs):
        try:
            resp = func(*args, **kwargs)
            return api_response(200, resp)
        except LookupError:
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Not found").compile()
            return api_response(404, resp)
        except Exception as e:
            logging.error(str(e))
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Internal error, please contact bugs@wasedatime.com.").compile()
            return api_response(500, resp)

    return handle


def fetch_top_thread():
    """Fetch the latest thread in the databse and return its body and thread_id

    :return: Body and thread_id of the latest thread
    """
    univ_id = "1"
    response = table_thread.query(
        # If query in this way, it will get the latest thread that is created. Since when query with GSI, the current case will
        # make all itmes sort in thread__id, which mean sort in created time in our case.
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('univ_id').eq(univ_id),
        ProjectionExpression="group_id, board_id, body", # This will reduce the information that is reuturned, but PK, SK is always returned.
        Limit=1,
        ScanIndexForward=False
    )

    items: list = response['Items']

    item = items[0]
    
    body = item['body']
    thread_id = item['thread_id']
    
    logging.info(f"Return value: {body}, {thread_id}")

    return body, thread_id


def fetch_comments(thread_id):
    """Use the thread_id to fetch all its comments from database

    :param thread_id: thread_id of the latest thread
    :return: All comments of the latest thread
    """
    response = table_comment.query(
        KeyConditionExpression = Key("thread_id").eq(thread_id)
    )

    items: list = response['Items']
    
    all_comment_body = []
    
    for item in items:
        all_comment_body += item["body"]
        

    logging.info(f"comments : {all_comment_body}")

    return json.dumps(all_comment_body)


def generate_prompt():
    body_thread_id = fetch_top_thread()
    
    thread_body, thread_id = body_thread_id
    thread_body = json.dumps(thread_body)
    
    comments = fetch_comments(thread_id)

    prompt_recent_threads = f'''\n\nHuman:
    Use the following example threads as your reference for topics and writing style of the students : original thread={thread_body}, comments={comments}
    You are a helpful international university student who is active in an online university forum.
    Generate 1 new comment for the thread after reading the original thread and comments.
    Ensure: 
    - Do not repeat the examples. 
    - Do not make any offers.
    - Respond strictly in format TOPIC: CONTENT
    Assistant:
    '''

    logging.info(f"Chosen Prompt : {prompt_recent_threads}")

    return prompt_recent_threads, thread_id


def get_bedrock_response():
    
    prompt, thread_id = generate_prompt()

    modelId = 'anthropic.claude-instant-v1'
    accept = 'application/json'
    contentType = 'application/json'

    body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 2000,
        "temperature": 0.8
    })

    response = bedrock_client.invoke_model(
        modelId=modelId,
        accept=accept,
        contentType=contentType,
        body=body
    )

    response_body = json.loads(response.get('body').read())

    completion: dict = response_body.get('completion')

    return completion, thread_id


# def select_comment():
#     completion, thread_id = get_bedrock_response()

#     pattern = re.compile(
#         r"(Academic|Job|Life|WTF):([\s\S]*?)(?=(Academic|Job|Life|WTF):|$)", re.IGNORECASE)

#     matches = pattern.findall(completion)

#     forum_posts = [{"topic": match[0], "content": match[1].strip()}
#                    for match in matches]

#     for post in forum_posts:
#         post['topic'] = post['topic'].lower()

#     try:
#         selected_thread = random.choice(forum_posts)
#         logging.info(selected_thread)
#         return selected_thread, thread_id
#     except IndexError:
#         logging.warning("LLM anomaly: No matching threads found.")
#         return None
    
    s