from boto3.s3.transfer import S3Transfer
from datetime import datetime
from util import *
import boto3
import logging
import os
import frontmatter

s3 = boto3.client('s3')
s3r = boto3.resource('s3')
transfesr = S3Transfer(s3)

dynamodb = boto3.resource('dynamodb')
table    = dynamodb.Table(os.getenv('TABLE_NAME'))

def insert_blog(file_path,key,bucket_name,btype):
    with open(file_path) as blog_content:
        logging.info(f"Insert blog: {key}")

        try:
            post = frontmatter.load(blog_content)
            item = {
                "category" : str(btype),
                "title" : post["title"], #get rid of .md
                "author" : post["author"],
                "summary": "",
                "src" : get_public_url(bucket_name, key),
                "created_at" : post["date"],
                "updated_at"  : datetime.now().strftime('%Y-%m-%d-%H-%M-%S'),
            }
            response = table.put_item(Item=item)
        except Exception as e:
            logging.error(f"Fail insert blog {key} :{e}")

        return response


def handler(event,context):
    for record in event['Records']:
        bucket_name = record['s3']['bucket']['name'] #get bucket name
        key = record['s3']['object']['key'] #get key
        os.makedirs('/tmp/blogs', exist_ok=True)
        file_path = '/tmp/blogs/tempfile'  + datetime.now().strftime('%Y-%m-%d-%H-%M-%S')
        btype = 0               #now all blogs' types are 0

        try:
            bucket = s3r.Bucket(bucket_name) #access bucket
            bucket.download_file(key,file_path) #download file
            insert_blog(file_path,key,bucket_name,btype) #insert contents into dynamodb
        except Exception as e:
            logging.error(f'Update blogs failed :{e}')