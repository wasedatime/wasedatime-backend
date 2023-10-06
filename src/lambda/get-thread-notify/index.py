from boto3.dynamodb.conditions import Key, Attr
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_thread_notify(last_checked_date):

    univ_id = 1

    lower_bound_thread_id = f"{last_checked_date}_"

    # Print for debugging
    print(f"Last checked date received: {last_checked_date}")
    print(f"Lower bound thread ID: {lower_bound_thread_id}")

    # Query the GSI
    response = table.query(
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('univ_id').eq(univ_id) & Key(
            'thread_id').gt(lower_bound_thread_id),
        ScanIndexForward=False  # Sorting by thread_id in descending order
    )

    count = len(response['Items'])

    # Print for debugging
    print(f"Number of items retrieved from the query: {count}")

    body = JsonPayloadBuilder().add_status(True)\
                               .add_data(count)\
                               .add_message('').compile()

    return body


def handler(event, context):

    params = {
        "last_checked_date": event['queryStringParameters'].get('lastChecked', '20230912201031')
    }

    # Print for debugging
    print(f"Handler received parameters: {params}")

    return get_thread_notify(**params)
