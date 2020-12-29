import boto3
import json
import os
from botocore.config import Config


def upload_to_s3(syllabus, school):
    """
    Upload the syllabus info of the department to s3
    :param syllabus: iterator of course info
    :param school: abbr of the department. e.g. "PSE"
    :return: dict :=
        {
            'Expiration': 'string',
            'ETag': 'string',
            'ServerSideEncryption': 'AES256'|'aws:kms',
            'VersionId': 'string',
            'SSECustomerAlgorithm': 'string',
            'SSECustomerKeyMD5': 'string',
            'SSEKMSKeyId': 'string',
            'SSEKMSEncryptionContext': 'string',
            'RequestCharged': 'requester'
        }
    """
    s3 = boto3.resource('s3', region_name="ap-northeast-1", verify=False, config=Config(signature_version='s3v4'))
    syllabus_object = s3.Object(os.getenv('BUCKET_NAME'), os.getenv('OBJECT_PATH') + school + '.json')
    body = bytes(json.dumps(list(syllabus)).encode('UTF-8'))
    resp = syllabus_object.put(
        ACL='private',
        Body=body,
        ContentType='application/json; charset=utf-8',
        CacheControl='public, max-age=86400, must-revalidate'
    )
    return resp
