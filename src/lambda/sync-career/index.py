import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table, bucket, s3_client


@resp_handler
def sync_career(key):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    s3_object = s3_client.get_object(Bucket=bucket, Key=key)
    file_content = s3_object['Body'].read().decode('utf-8')
    json_content = json.loads(file_content)

    # Get folder
    prefix = '/'.join(key.split('/')[:-1])
    objects_in_folder = s3_client.list_objects_v2(
        Bucket=bucket, Prefix=prefix)['Contents']

    # Extract image object keys (filter out the JSON file)
    image_object_keys = [obj['Key']
                         for obj in objects_in_folder if not obj['Key'].endswith('.json')]

    item = {
        'type': json_content['type'],
        'created_at': dt_now,
        'description': json_content['description'],
        'title': json_content['title'],
        'position': json_content['position'],
        'location': json_content['location'],
        'image_object_keys': image_object_keys
    }
    table.put_item(Item=item)

    body = JsonPayloadBuilder().add_status(True).add_data(
        None).add_message('Imgs key load to table successfully.').compile()
    return body


def handler(event, context):

    # Get the object from the event
    key = event['Records'][0]['s3']['object']['key']

    return sync_career(key)
