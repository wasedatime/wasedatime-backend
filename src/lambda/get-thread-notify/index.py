from boto3.dynamodb.conditions import Key, Attr
from utils import JsonPayloadBuilder, table, resp_handler


@resp_handler
def get_thread_notify(last_checked_date):

    Univ_Id = 1

    lower_bound_thread_id = f"{last_checked_date}_"
    # Query the GSI
    response = table.query(
        IndexName='UnivIDbyThreadIDIndex',
        KeyConditionExpression=Key('Univ_Id').eq(Univ_Id) & Key(
            'thread_id').gt(lower_bound_thread_id),
        ScanIndexForward=False  # Sorting by thread_id in descending order
    )

    count = len(response['Items'])

    body = JsonPayloadBuilder().add_status(True)\
                               .add_data(count)\
                               .add_message('').compile()

    return body


def handler(event, context):

    params = {
        "last_checked_date": event['queryStringParameters'].get('lastChecked', '20230912201031')
    }

    return get_thread_notify(**params)
