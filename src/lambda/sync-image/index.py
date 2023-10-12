import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table


@resp_handler
def post_imgskey(key):
    # Get the crrent time
    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    # Creaet board_id, ads_id from the event payload we got
    board_id, ad_id = key.split('/')

    # Create new item in the dynamoDB
    item = {
        'board_id': board_id,
        'ad_id': ad_id,
        'timestamp': dt_now
    }

    table.put_item(
        Item=item
    )

    body = JsonPayloadBuilder().add_status(True).add_data(
        None).add_message('Imgs key load to table successfully.').compile()
    return body


def handler(event, context):
    print(event)

    # Get event payload and get imgs information
    key = event['Records'][0]['s3']['object']['key']
    print(key)  # Try to fix
    board_id, ad_id = key.split('/')
    print(board_id, ad_id)

    return post_imgskey(key)
