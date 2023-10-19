import json
from datetime import datetime
from utils import JsonPayloadBuilder
from utils import resp_handler, table


# @resp_handler
# def post_imgskey(key):
#     # Get the crrent time
#     dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

#     # Creaet board_id, ads_id from the event payload we got
#     board_id, ad_id = key.split('/')

#     # Create new item in the dynamoDB
#     item = {
#         'board_id': board_id,
#         'ad_id': ad_id,
#         # Do not use `{}` to enclose the item, it will make it into a SS type which will cause error
#         'timestamp': dt_now
#     }

#     table.put_item(
#         Item=item
#     )

#     body = JsonPayloadBuilder().add_status(True).add_data(
#         None).add_message('Imgs key load to table successfully.').compile()
#     return body


def handler(event, context):
    pass
