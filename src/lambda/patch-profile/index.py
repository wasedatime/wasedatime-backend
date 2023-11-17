import json
from boto3.dynamodb.conditions import Attr
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler, extract_and_format_date


@resp_handler
def patch_profile(uid, profile, created_date):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    table.update_item(
        Key={
            "uid": uid,
            "created_at": created_date
        },
        ConditionExpression=Attr('uid').eq(uid),
        UpdateExpression='SET #nm = :name, email = :email,  #yr = :year, class_of = :class_of, languages = :languages, interests = :interests, school = :school, updated_at = :ts',
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
            "#nm": "name",
            "#yr": "year"
        }
    )

    body = JsonPayloadBuilder().add_status(
        True).add_data(None).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "profile": req["data"],
        "uid": event['requestContext']['authorizer']['claims']['sub'],
    }

    try:
        formatted_time = extract_and_format_date(event)
        if formatted_time:
            params["created_date"] = formatted_time
    except Exception as e:
        print(f"An error occurred: {e}")

    return patch_profile(**params)