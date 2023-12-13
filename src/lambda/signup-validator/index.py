from utils import test_user


def handler(event, context):
    email = event["request"]["userAttributes"]["email"]
    domain = email.split('@')[1]

    # Check for the specific test email address
    if email == test_user:
        event["response"]["autoConfirmUser"] = True
        return event

    # Check if the domain is waseda.jp
    if domain == "waseda.jp":
        event["response"]["autoConfirmUser"] = True
        return event

    raise Exception("Invalid sign-up request: identity check failed.")
