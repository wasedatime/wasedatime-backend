import json
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


if __name__ == '__main__':
    schools = ["GEC", "CMS", "HSS", "EDU", "FSE", "ASE", "CSE", "G_ASE", "LAW", "G_FSE", "SOC", "SSS", "G_LAS", "G_CSE",
               "G_EDU", "HUM", "SILS", "G_HUM", "CJL", "SPS", "G_WBS", "G_PS", "G_SPS", "G_IPS", "G_WLS", "G_E",
               "G_SSS", "G_SC", "G_LAW", "G_SAPS", "G_SA", "G_SJAL", "G_SICCS", "G_SEEE", "EHUM", "ART", "CIE", "G_ITS"]
    for school in schools:
        logging.info(f"Started scraping school: {school}")
        syllabus_info = SyllabusCrawler(school=school, worker=32).execute()
        with open(f'{school}.json', 'w', encoding='utf-8') as f:
            json.dump(list(syllabus_info), f)
