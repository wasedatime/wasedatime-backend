import logging
from crawler import SyllabusCrawler
from utils import upload_to_s3


def handler(event, context):
    """
    Lambda function handler
    :param event:
    :param context:
    :return:
    """
    schools = event["schools"]
    for school in schools:
        logging.info(f"Started scraping school: {school}")
        syllabus_info = SyllabusCrawler(school=school, worker=32).execute()
        logging.info(f"Finished scraping school: {school}")
        logging.info(f"Uploading {school}.json to S3 ")
        upload_to_s3(syllabus_info, school)
        logging.info(f"Successfully uploaded {school}.json")
    return None
