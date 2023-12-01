import json
from utils import JsonPayloadBuilder, resp_handler, CourseRecommender, s3_client, bucket, ai_client
from const import *


@resp_handler
def post_chat(prompt, timetable, chatlog):
    recommender = CourseRecommender(s3_client, bucket, school_code_map)


    prompt = recommender.generate_gpt_prompt(prompt, timetable, chatlog)
    
    response = ai_client.chat.completions.create(
      model= "gpt-4-1106-preview",
      messages= prompt
    )
    
    message = response.choices[0].message.content
    
    data = {"messageContent": message, "messageType": "bot"}
    

    body = JsonPayloadBuilder().add_status(
        True).add_data(data).add_message('').compile()
    return body


def handler(event, context):
    req = json.loads(event['body'])
    params = {
        "timetable": req["data"]["timetable"],
        "prompt": req['data']['prompt'],
        "chatlog": req['data']['chatlog'],
    }

    return post_chat(**params)
