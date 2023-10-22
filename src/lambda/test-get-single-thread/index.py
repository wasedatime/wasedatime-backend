from boto3.dynamodb.conditions import Key, Attr
from datetime import datetime, timedelta
from utils import JsonPayloadBuilder, table, resp_handler, s3_client, bucket, generate_url


@resp_handler
def get_threads():
    # Calculate the timestamp for one month ago
    one_month_ago = (datetime.utcnow() - timedelta(days=30)).timestamp()

    thread_id_for_last_month = str(int(one_month_ago)) + \
        "_00000000-0000-0000-0000-000000000000"

    # Use the query method to fetch recent one month's data using the secondary index
    response = table.query(
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('univ_id').begins_with(1) & Key('thread_id').gt(
            thread_id_for_last_month)
    )

    items = response['Items']

    body = JsonPayloadBuilder().add_status(
        True).add_data(items).add_message('').compile()
    return body


def handler(event, context):

    return get_threads()
