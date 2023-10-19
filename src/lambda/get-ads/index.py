from boto3.dynamodb.conditions import Key
from utils import JsonPayloadBuilder
from utils import resp_handler, table, bucket, generate_url

# typeI api call => no query parameter -> scan and return the whole table
# typeII api call => only have board_id -> return all items with matching board_id.
# typeIII api call => have both board and ad ids -> return only the url.


@resp_handler
def get_imgs_list(board_id, ad_id):

    # typeIII 
    if board_id and ad_id: 
        # Create the key and url when typeII api call
        key = "/".join([board_id, ad_id])
        bucket_name = bucket
        ad_url = generate_url(bucket_name, key)
        results = ad_url
    
    # typeII
    elif board_id:
        response = table.query(KeyConditionExpression=Key(
            "board_id").eq(board_id), ScanIndexForward=False)
        results = response

    # typeI
    else:
        response = table.scan(ConsistentRead=False)
        results = response

    # response = table.scan()
    # results = response.get('Items', [])

    body = JsonPayloadBuilder().add_status(
        True).add_data(results).add_message('').compile()
    return body


def handler(event, context):

    # params = event["queryStringParameters"]
    # board_id = params.get("board_id", "")
    
    params = {
        "board_id": event["queryStringParameters"]["board_id"],
    }
    if "ad_id" in event["queryStringParameters"]:
        params["ad_id"] = event["queryStringParameters"]["ad_id"]
    

    return get_imgs_list(**params)
