import boto3
import json
import logging
import os
from decimal import Decimal
from datetime import datetime
from boto3.dynamodb.conditions import Key
from const import *
from openai import OpenAI

db = boto3.resource("dynamodb", region_name="ap-northeast-1")
table = db.Table(os.getenv('TABLE_NAME'))

s3_client = boto3.client('s3')
bucket = os.getenv('SYLLABUS_BUCKET_NAME')

UID = os.getenv('UID')

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

ai_client = OpenAI(
    api_key = OPENAI_API_KEY
)

bedrock_client = boto3.client('bedrock-runtime', region_name='ap-northeast-1')


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


class ExtendedEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, set):
            return list(obj)
        return super(ExtendedEncoder, self).default(obj)


class JsonPayloadBuilder:
    payload = {}

    def add_status(self, success):
        self.payload['success'] = success
        return self

    def add_data(self, data):
        self.payload['data'] = data
        return self

    def add_message(self, msg):
        self.payload['message'] = msg
        return self

    def compile(self):
        return json.dumps(self.payload, cls=ExtendedEncoder, ensure_ascii=False).encode('utf8')


def api_response(code, body):
    return {
        "isBase64Encoded": False,
        "statusCode": code,
        'headers': {
            "Access-Control-Allow-Origin": '*',
            "Content-Type": "application/json",
            "Referrer-Policy": "origin"
        },
        "multiValueHeaders": {"Access-Control-Allow-Methods": ["POST", "OPTIONS", "GET", "PATCH", "DELETE"]},
        "body": body
    }


def resp_handler(func):
    def handle(*args, **kwargs):
        try:
            resp = func(*args, **kwargs)
            return api_response(200, resp)
        except LookupError:
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Not found").compile()
            return api_response(404, resp)
        except Exception as e:
            logging.error(str(e))
            resp = JsonPayloadBuilder().add_status(False).add_data(None) \
                .add_message("Internal error, please contact bugs@wasedatime.com.").compile()
            return api_response(500, resp)

    return handle



class CourseRecommender:
    def __init__(self, s3_client, bucket, school_code_map, syllabus_file_template="syllabus/{}.json"):
        self.s3_client = s3_client
        self.bucket = bucket
        self.simplified_timetable = []
        self.id_to_title = {}
        self.school_code_map = school_code_map
        self.syllabus_file_template = syllabus_file_template
        self.day_map = {1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday'}

    def set_timetable(self, timetable_data):
        self.timetable_data = timetable_data

    def fetch_syllabus(self):
        most_frequent_school_code = self.get_most_frequent_school_code()
        file_key = self.syllabus_file_template.format(self.school_code_map[most_frequent_school_code])
        response = self.s3_client.get_object(Bucket=self.bucket, Key=file_key)
        file_content = response['Body'].read().decode('utf-8')
        self.courses = json.loads(file_content)
        self.id_to_title = {course['a']: course['b'] for course in self.courses}

    def get_most_frequent_school_code(self):
        school_code_counts = {}
        for course in self.timetable_data['courses']:
            school_code = course['id'][:2]  # first two letters are key
            school_code_counts[school_code] = school_code_counts.get(school_code, 0) + 1
        return max(school_code_counts, key=school_code_counts.get)

    def filter_courses_by_term(self, desired_terms):
        filtered = []
        for course in self.courses:
            if 'f' in course and 'h' in course and 1 in course['f'] and course['h'] in desired_terms and course['g'] != 1:
                filtered_course = { key: course[key] for key in course if key not in ['c', 'e', 'o', 'p', 'q', 'r', 'f', 'h', 'k', 'm', 'n']}
                filtered.append(filtered_course)
        return filtered

    def get_timetable_course_ids(self):
        return [course['id'] for course in self.timetable_data['courses']]

    def count_min_years(self, filtered_courses):
        min_years_count = {1: 0, 2: 0, 3: 0, 4: 0}
        timetable_course_ids = self.get_timetable_course_ids()
        for course in filtered_courses:
            if course['a'] in timetable_course_ids:
                min_year = course.get('j')
                if min_year in min_years_count:
                    min_years_count[min_year] += 1
        return min_years_count

    def filter_courses_by_min_year(self, filtered_courses, most_common_min_year):
        return [course for course in filtered_courses if course.get('j') == most_common_min_year]

    def exclude_conflicting_courses(self, filtered_courses):
    # Create a set of tuples for each (day, period) in the actual timetable
        timetable_schedule = set()
        for course_id in self.get_timetable_course_ids():
            course = next((c for c in filtered_courses if c['a'] == course_id), None)
            if course:
                print(course)
                for occurrence in course.get('i', []):
                    day = occurrence.get('d')
                    period = occurrence.get('p')
                    timetable_schedule.add((day, period))

        print(timetable_schedule)

        # Exclude courses that have conflicting days and periods with the timetable
        non_conflicting_courses = []
        for course in filtered_courses:
            course_id = course.get('a')
            if course_id not in self.get_timetable_course_ids():
                # Check if this course's occurrences conflict with the timetable
                course_occurrences = course.get('i', [])
                if not any((occ.get('d'), occ.get('p')) in timetable_schedule for occ in course_occurrences):
                    non_conflicting_courses.append(course)

        return non_conflicting_courses

    def create_timetable_with_titles(self):
        timetable_with_titles = self.timetable_data.copy()
        timetable_with_titles['courses'] = [course for course in timetable_with_titles['courses'] if (course_title := self.id_to_title.get(course['id'])) is not None]
        for course in timetable_with_titles['courses']:
            course['title'] = self.id_to_title[course['id']]
        return [ {"id": course["id"], "title": course["title"]} for course in timetable_with_titles["courses"] ]

    def transform_filtered_courses(self, filtered_courses):
        for course in filtered_courses:
            if 'i' in course:
                occurrences = course['i']
                course['schedule'] = ', '.join(f"Day: {self.day_map.get(occurrence['d'], 'Unknown')}, Period: {occurrence['p']}, Location: {occurrence['l']}" for occurrence in occurrences)
                del course['i']
            if 'l' in course:
                course['credits'] = course['l']
                del course['l']

    def filter_courses(self, desired_terms=['2q', '3q', '2s']):
        filtered_courses = self.filter_courses_by_term(desired_terms)
        min_years_count = self.count_min_years(filtered_courses)
        most_common_min_year = max(min_years_count, key=min_years_count.get)
        filtered_courses = self.filter_courses_by_min_year(filtered_courses, most_common_min_year)
        filtered_courses = self.exclude_conflicting_courses(filtered_courses)
        self.transform_filtered_courses(filtered_courses)
        self.simplified_timetable = self.create_timetable_with_titles()
        return filtered_courses
    
    
    def generate_gpt_prompt(self, user_query, timetable, chatlog):
        self.set_timetable(timetable)
        self.fetch_syllabus()
        self.filter_courses()
        timetable_str = "My timetable:\n" + json.dumps(self.simplified_timetable)
        filtered_courses_str = "Filtered courses:\n" + json.dumps(self.filter_courses(['2q', '3q', '2s']))
        chatlog_str = "Presious chats:\n" + json.dumps(chatlog)
        combined_str = timetable_str + "\n" + filtered_courses_str + "\n" + chatlog_str

        # Format the prompt for GPT
        prompt = [
            {"role": "system", "content": "You are a course recommendation assistant for university students named courseGPT. Your task is to recommend courses based on the student's current timetable and a list of filtered courses only IF they ask. \n\n Answer in the format of : '''Based on your current timetable, you are interested in : [Assistant explain user interest] \n Here are three recommended courses: [Assistant to list three suitable courses with explanations that include credits or professors and more. Put two asterisks around the course title]''' Then, only at the end provide the course ids which are stored in attribute 'a' in bullet point lists"},
            {"role": "user", "content": combined_str},
            {"role": "assistant", "content": "Thank you for providing me with your current timetable!"},            
            {"role": "user", "content": user_query},
        ]
        
        return prompt