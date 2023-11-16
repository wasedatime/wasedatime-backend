import json
from datetime import datetime
import logging

from utils import JsonPayloadBuilder, db, resp_handler, table_name


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

    application_data = {
        "type": "application",
        "created_at": dt_now,
        "uid": uid,
        "title": application["title"],
        "job_id": application["job_id"],
        "company": application["company"],
    }

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
                'Item': application_data
            }
        },
        {
            'Update': {
                'TableName': table_name,
                'Key': {
                    "type": "internship",
                    "created_at": application["created_at"],
                },
                'UpdateExpression': 'ADD applicants :uid',
                'ConditionExpression': 'attribute_not_exists(applicants) OR NOT contains(applicants, :uid)',
                'ExpressionAttributeValues': {
                    ':uid': {uid}
                }
            }
        }
    ]

    try:
        db.transact_write_items(TransactItems=transact_items)
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
