import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table, bucket, s3_client, get_image_key, build_job_id

@resp_handler
def sync_career(key):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    job_id = build_job_id()

    try:
        print(f"Starting sync_career with key: {key}")
        
        s3_object = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = s3_object['Body'].read().decode('utf-8')
        json_content = json.loads(file_content)
        print("JSON content loaded successfully.")

        # Get folder (company name)
        folder = key.split('/')[0]
        print(f"Folder (company name): {folder}")

        # Construct keys for images
        hero_image_key = get_image_key(folder, "hero_image")
        company_logo_key = get_image_key(folder, "company_logo")
        print(f"Image keys: hero_image_key={hero_image_key}, company_logo_key={company_logo_key}")

        item = {
            'job_id': job_id,
            'title': json_content['title'],
            'company_description': json_content['company_description'],
            'location': json_content['location'],
            'created_at': dt_now,
            'company': json_content['company'],
            'job_description': json_content['job_description'],
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

        print(f"Item to be inserted: {item}")
        table.put_item(Item=item)
        print("Item inserted into DynamoDB table successfully.")

        body = JsonPayloadBuilder().add_status(True).add_data(
            None).add_message('Imgs key load to table successfully.').compile()
        print("Payload built successfully.")
        return body
    
    except Exception as e:
        # Handle any exceptions that occur
        print(f"Exception occurred: {str(e)}")
        return JsonPayloadBuilder().add_status(False).add_message(str(e)).compile()


def handler(event, context):

    # Get the object from the event
    print("Lambda handler started.")
    key = event['Records'][0]['s3']['object']['key']
    print(f"Received key from event: {key}")

    return sync_career(key)
