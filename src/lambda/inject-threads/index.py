from datetime import datetime
from utils import JsonPayloadBuilder, resp_handler, select_thread, build_thread_id, UID, table, select_school, UNIV_ID


@resp_handler
def inject_thread(topic, content):
    thread_id = build_thread_id()
    selected_school = select_school()

    dt_now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'

    thread_item = {
        "board_id": topic,
        "created_at": dt_now,
        "updated_at": dt_now,
        "title": "default",
        "body": content,
        "uid": UID,
        "thread_id": thread_id,
        "tag_id": "default",
        "group_id": selected_school,
        "univ_id": UNIV_ID,
        "views": 0,
        "comment_count": 0,
        "new_comment": False,
    }

    table.put_item(Item=thread_item)

    body = JsonPayloadBuilder().add_status(
        True).add_data('').add_message('').compile()
    return body


def handler(event, context):
    resp = select_thread()

    if resp is None:
        # No threads were found; end the Lambda function.
        return

    return inject_thread(**resp)
