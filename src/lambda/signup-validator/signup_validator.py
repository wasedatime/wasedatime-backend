def handler(event, context):
    email = event["request"]["userAttributes"]["email"]
    domain = email.split('@')[1]

    if domain[-9:] == "waseda.jp":
        event["response"]["autoConfirmUser"] = True
    event["response"]["autoConfirmUser"] = False

    return event
