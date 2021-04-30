import json
from utils import JsonPayloadBuilder
from utils import resp_handler
from boto3.dynamodb.conditions import Key
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table    = dynamodb.Table(os.getenv('TABLE_NAME'))

def get_blogs(offset,limit):
       
    query_result = table.query(
      KeyConditionExpression = Key("category").eq("0"),
      ScanIndexForward = False,
      Limit = offset + limit
    )

    indexes = []
    cnt = 0
    if offset < len(query_result['Items']):
        indexes = query_result['Items'][offset:]

    return {
        "articles" : indexes,
        "size" : len(indexes)
    }



@resp_handler
def query_blogs(offset,limit):
    blogs = get_blogs(offset,limit)
    resp_body = JsonPayloadBuilder().add_status(True).add_data(blogs).add_message('').compile()
    return resp_body

def handler(event, context):
    params = {
        "offset": int(event["queryStringParameters"]["offset"]),
        "limit" : int(event["queryStringParameters"]["limit"])
    }

    return query_blogs(**params)