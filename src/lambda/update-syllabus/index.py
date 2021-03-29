import json
import boto3
import logging
import os
from boto3.s3.transfer import S3Transfer
from const import *
from utils import *


s3 = boto3.client('s3')
s3r = boto3.resource('s3')
transfesr = S3Transfer(s3)

dynamodb = boto3.resource('dynamodb')
table    = dynamodb.Table(os.getenv('TABLE_NAME'))
    
    
def compare_syllabus(now_name,old_name,school):
    old_dict = {}
    with open(old_name) as old_file:
        old_syllabus = json.load(old_file)
    with open(now_name) as now_file:
        new_syllabus = json.load(now_file)
    
    #store every old item in dict
    for i in range(0,len(old_syllabus)):
        cs = Course(old_syllabus[i])
        old_dict[cs.id] = cs
        
    print(len(old_syllabus))
    
    #compare old and new syllabus
    for new_item in new_syllabus:
        new_cs = Course(new_item)
        match_id = new_cs.id
        if(match_id in old_dict):
            if(old_dict[match_id].data != new_cs.data):
                update_course(new_cs,table,school)
        else:
            insert_course(new_cs,table,school)
            

def handler(event,context):
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name'] #get bucket name
        key = record['s3']['object']['key'] #get key
        school = key[9:]
        school = school[0:school.find('.')]
        
        #get past versions
        versions = s3r.Bucket(bucket).object_versions.filter(Prefix=key)
        cnt = 0
        now_version_obj = None
        old_version_obj = None
        now_name = ""
        old_name = ""
        os.makedirs('/tmp/', exist_ok=True)
        
        for version in versions:
            cnt = cnt + 1
            if cnt == 1:
                now_version_obj = version.get()
                #set name for json file downloaded
                now_name = '/tmp/' + now_version_obj.get("LastModified").strftime("%Y%m%d%H%M%S") +'.json'
                # Get old version json and new version json
                transfesr.download_file(bucket,key,now_name,extra_args={'VersionId': now_version_obj['VersionId'] })
            elif cnt == 2:
                old_version_obj = version.get()
                old_name = '/tmp/' + old_version_obj.get("LastModified").strftime("%Y%m%d%H%M%S") +'.json'
                transfesr.download_file(bucket,key,old_name,  extra_args={'VersionId': old_version_obj['VersionId'] })
            else:
                break
        
        if cnt >= 2:
            compare_syllabus(now_name,old_name,school)

