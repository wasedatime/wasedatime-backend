from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder
from utils import resp_handler
from utils import table


@resp_handler
def get_imgs_list(board_id):

    if board_id:
        response = table.query(KeyConditionExpression=Key(
            "board_id").eq(board_id), ScanIndexForward=False)
    else:
        response = table.scan(ConsistentRead=False)

    results = response.get('Items', [])

    # response = table.scan()
    # results = response.get('Items', [])

    body = JsonPayloadBuilder().add_status(
        True).add_data(results).add_message('').compile()
    return body


def handler(event, context):

    params = event["queryStringParameters"]
    board_id = params.get("board_id", "")
    return get_imgs_list(board_id)
