import json
from datetime import datetime

from utils import JsonPayloadBuilder, table, resp_handler, format_time


@resp_handler
def post_profile(profile, uid, created_date, school_email):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    # created_date = get_user_creation_date(uid)  

    user_profile = {
        "uid": uid,
        "name" : profile["name"],
        "email" : profile["email"],
        "school_email": school_email,
        "year" : profile["year"],
        "class_of" : profile["class_of"],
        "languages" : profile["languages"],
        "interests" : profile["interests"],
        "school" : profile["school"],
        "created_at": created_date,
        "updated_at": dt_now
    }
    table.put_item(Item=user_profile)

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
        email = event['requestContext']['authorizer']['claims']['email']
        date_created_At = event['requestContext']['authorizer']['claims']['identities']["dateCreated"]
        print(email)
        print(date_created_At)
        
        formatted_time = format_time(date_created_At)
        
        params["created_date"] = formatted_time
        params["school_email"] = email
    except Exception as e:
        print(e)
        
   
    
    return post_profile(**params)