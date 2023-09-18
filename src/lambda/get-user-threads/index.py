from boto3.dynamodb.conditions import Key, Attr
import boto3
from datetime import datetime
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_user_threads(uid=""):

    # Query the GSI
    response = table.query(
        IndexName='UidbyThreadIDIndex',  # Replace with your actual GSI name
        KeyConditionExpression=Key('uid').eq(uid),
        FilterExpression=Attr('new_comment').eq(True),
        ScanIndexForward=False  # Sorting by thread_id in descending order
    )

    results = response['Items']

    # Count the threads with new comments
    new_comment_count = len(results)

    # Collect the thread_ids
    thread_ids = [item['thread_id'] for item in results]

    # Determine the response data based on new_comment_count
    response_data = True if new_comment_count > 1 else {
        'thread_ids': thread_ids, 'new_comment_count': new_comment_count}

    body = JsonPayloadBuilder().add_status(True)\
                               .add_data(response_data)\
                               .add_message('Fetched successfully').compile()

    return body


def handler(event, context):

    print(event)

    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub']
    }
    # uid = "356defaa-8907-4003-be7e-f0e6502392d7"

    # index = event['queryStringParameters'].get('index', '0')
    # num = event['queryStringParameters'].get('num', '10')

    return get_user_threads(**params)
