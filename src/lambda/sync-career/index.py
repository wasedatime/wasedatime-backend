import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table, bucket, s3_client


@resp_handler
def sync_career(key):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    try:
        s3_object = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = s3_object['Body'].read().decode('utf-8')
        json_content = json.loads(file_content)

        # Get folder (company name)
        folder = key.split('/')[0]  # Assuming the folder is the first part of the key

        # Construct keys for images
        hero_image_key = f"{folder}/hero_image"
        company_logo_key = f"{folder}/company_logo"
    

        item = {
            'job_id': json_content['job_id'],
            'title': json_content['title'],
            'company_description': json_content['company_description'],
            'location': json_content['location'],
            'created_at': dt_now,
            'company': json_content['company'],
            'job_description': json_content['job_description'],
            'responsibilities': json_content['responsibilities'],
            'qualifications': json_content['qualifications'],
            'appeal': json_content['appeal'],
            'min_hours': json_content['min_hours'],
            'salary': json_content['salary'],
            'website': json_content['website'],
            'type': json_content['type'],
            'apply': json_content['apply_link'],
            'hero_image': hero_image_key,
            'company_logo': company_logo_key,
        }


        table.put_item(Item=item)

        body = JsonPayloadBuilder().add_status(True).add_data(
            None).add_message('Imgs key load to table successfully.').compile()
        return body
    
    except Exception as e:
        # Handle any exceptions that occur
        return JsonPayloadBuilder().add_status(False).add_message(str(e)).compile()


def handler(event, context):

    # Get the object from the event
    key = event['Records'][0]['s3']['object']['key']

    return sync_career(key)
