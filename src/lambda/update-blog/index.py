from boto3.s3.transfer import S3Transfer
from datetime import datetime
from util import *
import boto3
import logging
import os

s3 = boto3.client('s3')
s3r = boto3.resource('s3')
transfesr = S3Transfer(s3)

dynamodb = boto3.resource('dynamodb')
table    = dynamodb.Table(os.getenv('TABLE_NAME'))

def insert_blog(file_path,key,bucket_name):
    with open(file_path) as blog_content:
        logging.info("Insert blog:" + key)
        print(key)
        try:
            blog_content.readline()
            head = {}
            for i in range(0,3):
                text = blog_content.readline().split(':',1)
                head[text[0].strip()] = text[1].strip()
            
            item = {
                "title" : head["title"], #get rid of .md
                "author" : head["author"],
                "src" : get_public_url(bucket_name, key),
                "created_at" : head["date"]
                "update_at"  : datetime.now().strftime('%Y-%m-%d-%H-%M-%S'),
            }
            response = table.put_item(Item=item)
        except Exception as e:
            logging.error("Fail insert blog:" + key)
            logging.error(e)
        return response


def handler(event,context):
    for record in event['Records']:
        bucket_name = record['s3']['bucket']['name'] #get bucket name
        key = record['s3']['object']['key'] #get key
        os.makedirs('/tmp/blogs', exist_ok=True)
        file_path = '/tmp/' + key + '_' + datetime.now().strftime('%Y-%m-%d-%H-%M-%S')

        try:
            bucket = s3r.Bucket(bucket_name) #access bucket
            bucket.download_file(key,file_path) #download file
            insert_blog(file_path,key,bucket_name) #insert contents into dynamodb
        except Exception as e:
            logging.error("S3 download failed")
            logging.error(e)