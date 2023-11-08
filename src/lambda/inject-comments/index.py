from datetime import datetime
from utils import JsonPayloadBuilder, resp_handler, UID, table_comment, UNIV_ID, get_bedrock_response


@resp_handler
def inject_comment(content, thread_id):

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    comment_item = {
        "thread_id": thread_id,
        "created_at": dt_now,
        "updated_at": dt_now,
        "body": content,
        "uid": UID
    }

    table_comment.put_item(Item=comment_item)

    body = JsonPayloadBuilder().add_status(
        True).add_data('').add_message('').compile()
    return body


def handler(event, context):
    resp = get_bedrock_response()
    
    content, thread_id = resp

    if resp is None:
        # No threads were found; end the Lambda function.
        return

    return inject_comment(content, thread_id)
