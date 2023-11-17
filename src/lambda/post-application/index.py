import json
from datetime import datetime
import logging

from utils import JsonPayloadBuilder, dynamodb_client, resp_handler, table_name


@resp_handler
def post_application(application, uid):
    '''
        type: application
        created_at: created_at (application)
        uid: uid (also serves as application id)
        title: job_title
        company: company_name
        job_id: job_id
    '''

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    '''
    transact items, ensures that both operations succeed. 
    If one fails the other automatically fails. 
    This is to be used when two actions must be ensured. This can be used cross table also.
    The catch is that it seems to take more resources.
    Meaning it is more expensive. So be considerate.
    '''
    transact_items = [
        {
            'Put': {
                'TableName': table_name,
                'Item': {
                "type": {"S": "application"},
                "created_at": {"S": dt_now},
                "uid": {"S": uid},
                "title": {"S": application["title"]},
                "job_id": {"S": application["job_id"]},
                "company": {"S": application["company"]},
                "email": {"S": application["email"]},
                "name": {"S": application["name"]},
                "agreed": {"BOOL": application["agreed"]},
                }
            }
        },
        {
            'Update': {
                'TableName': table_name,
                'Key': {
                    "type": {"S": "internship"},
                    "created_at": {"S": application["created_at"]},
                },
                'UpdateExpression': 'ADD applicants :uid',
                'ConditionExpression': 'NOT contains(applicants, :uid)',
                'ExpressionAttributeValues': {
                    ':uid': {"SS": [uid]}
                }
            }
        }
    ]

    try:
        dynamodb_client.transact_write_items(TransactItems=transact_items)
        logging.error(
            "Transaction successful: Application submitted and Internship record updated.")
    except Exception as e:
        logging.error("Transaction failed: %s", e)
        raise

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('applied').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "application": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub'],
    }

    return post_application(**params)
