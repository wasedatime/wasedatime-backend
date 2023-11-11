import json
from boto3.dynamodb.conditions import Attr
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def patch_profile(uid, profile):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    table.update_item(
        Key={
            "uid": uid,
        },
        ConditionExpression=Attr('uid').eq(uid),
        UpdateExpression='SET #nm = :name, email = :email, year = :year, class_of = :class_of, languages = :languages, interests = :interests, school = :school, updated_at = :ts',
        ExpressionAttributeValues={
            ":name": profile["name"],
            ":email": profile["email"],
            ":year": profile["year"],
            ":class_of": profile["class_of"],
            ":languages": profile["languages"],
            ":interests": profile["interests"],
            ":school": profile["school"],
            ":ts": dt_now
        },
        ExpressionAttributeNames = {
            "#nm": "name"
        }
    )

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):

    req = json.loads(event['body'])
    params = {
        "uid": event['requestContext']['authorizer']['claims']['sub'],
        "profile": req["data"]
    }

    return patch_profile(**params)