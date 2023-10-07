import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table, output_table




@resp_handler
def post_imgskey(key):
    # Get the crrent time
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
    
    # Creaet board_id, ads_id from the event payload we got
    board_id, thread_id, _ = key.split('/')
    
    # Create new item in the dynamoDB
    item = {
        'board_id': {'S': board_id},
        'ads_id': {'S': thread_id},
        'timestamp': {'S': dt_now}
    }
    
    table.put_item(
        TableName=output_table,
        Item=item
    )



    body = JsonPayloadBuilder().add_status(True).add_data(None).add_message('Imgs key load to table successfully.').compile()
    return body


def handler(event, context):
    
    # Get event payload and get imgs information
    key = event['Records'][0]['s3']['object']['key']

    return post_imgskey(key)
