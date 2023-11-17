from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime, timedelta
from utils import JsonPayloadBuilder, table, resp_handler, s3_client, bucket, generate_url


@resp_handler
def get_threads():

    univ_id = "1"

    response = table.query(
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('univ_id').eq(univ_id),
        ProjectionExpression="group_id, board_id, body",
        Limit=10,
        ScanIndexForward=False
    )

    print(response)

    items = response['Items']

    print(items)

    body = JsonPayloadBuilder().add_status(
        True).add_data(items).add_message('').compile()
    return body


def handler(event, context):

    return get_threads()
