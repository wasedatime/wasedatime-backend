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
table = db.Table(os.getenv('THREAD_TABLE_NAME'))

s3_client = boto3.client('s3')
bucket = os.getenv('BUCKET_NAME')

UID = os.getenv('UID')

UNIV_ID = "1"


file_key = 'syllabus/SILS.json'

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


def build_thread_id():

    unique_id = str(uuid.uuid4())

    ts = datetime.now().strftime('%Y%m%d%H%M%S')

    thread_id = f"{ts}_{unique_id}"

    return thread_id


def fetch_threads():
    univ_id = "1"
    response = table.query(
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('univ_id').eq(univ_id),
        ProjectionExpression="group_id, board_id, body",
        Limit=10,
        ScanIndexForward=False
    )

    items: list = response['Items']

    categorized_threads = {
        board: [item['body'] for item in items if item['board_id'] == board]
        for board in ['wtf', 'life', 'job', 'academic']
    }

    logging.info(f"categorized : {categorized_threads}")

    return json.dumps(categorized_threads)


def fetch_timetable():
    response = s3_client.get_object(Bucket=bucket, Key=file_key)
    file_content = response['Body'].read().decode('utf-8')

    syllabus = json.loads(file_content)

    tmp_timetable = []

    for item in syllabus:
        # Check if 'm' is 0 and 'h' is '2s'
        if item.get('m') == 0 and item.get('h') == '2s':
            # Extract fields b, d, k
            extracted_dict = {
                'title': item['b'], 'prof': item['d'], 'category': item['k']}
            tmp_timetable.append(extracted_dict)

    timetable = random.sample(tmp_timetable, 6)
    return timetable


def generate_prompt():
    threads = fetch_threads()

    prompt_recent_threads = f'''\n\nHuman:
    Use the following example threads as your reference for topics and writing style of the students : {threads}
    You are a helpful international university student who is active in an online university forum.
    Generate 4 new forum posts for each given topics like if you are an university student.
    Ensure: 
    - Do not repeat the examples. 
    - Do not make any offers.
    Assistant:
    '''

    logging.info(f"Chosen Prompt : {prompt_recent_threads}")

    return prompt_recent_threads


def get_bedrock_response():

    prompt = generate_prompt()

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

    return completion


def select_thread():
    completion = get_bedrock_response()

    pattern = re.compile(
        r"(Academic|Job|Life|WTF):([\s\S]*?)(?=(Academic|Job|Life|WTF):|$)", re.IGNORECASE)

    matches = pattern.findall(completion)

    forum_posts = [{"topic": match[0], "content": match[1].strip()}
                   for match in matches]

    for post in forum_posts:
        post['topic'] = post['topic'].lower()

    try:
        selected_thread = random.choice(forum_posts)
        logging.info(selected_thread)
        return selected_thread
    except IndexError:
        logging.warning("LLM anomaly: No matching threads found.")
        return None


def select_school():
    school_options = ['SILS', 'PSE', 'SSS',
                      'FSE', 'SOC', 'CSE', 'CJL', 'G_SICCS']

    selected_school = random.choice(school_options)

    logging.info(selected_school)

    return selected_school
