import boto3
import os
import json
from PIL import Image
from io import BytesIO
from utils import JsonPayloadBuilder
from utils import resp_handler, input_bucket, output_bucket, table, s3_client


@resp_handler
def resize_image(key):

    # Download the image from S3
    s3_object = s3_client.get_object(Bucket=input_bucket, Key=key)
    image_data = s3_object['Body'].read()
    board_id, thread_id, _ = key.split('/')

    thumb_key = f"{thread_id}.jpeg"

    # Open the image with PIL
    with Image.open(BytesIO(image_data)) as img:
        # Resize the image
        img.thumbnail((128, 128))
        buffer = BytesIO()
        img.save(buffer, 'JPEG')
        buffer.seek(0)

    # Upload the resized image to S3
    s3_client.put_object(
        Body=buffer, ContentType='image/jpeg', Bucket=output_bucket, Key=thumb_key)

    board_id, thread_id, _ = key.split('/')

    table.update_item(
        Key={'board_id': board_id, 'thread_id': thread_id},
        UpdateExpression='SET thumb_key = :thumbKey',
        ExpressionAttributeValues={':thumbKey': thumb_key}
    )

    body = JsonPayloadBuilder().add_status(True).add_data(
        None).add_message("Image resized successfully.").compile()
    return body


def handler(event, context):

    # Get the object from the event
    key = event['Records'][0]['s3']['object']['key']

    return resize_image(key)
