import urllib.request as requests
from const import *
from datetime import datetime
from lxml import html
from utils import *


class SyllabusCrawler:
    def __init__(self, school, worker=8):
        """
        :param school: department name
        :param task: tasks to execute
        :param engine: "thread-only" | "hybrid",
        :param worker: num of worker threads
        """
        if school not in school_name_map.keys():
            raise ValueError
        self.school = school
        self.worker = worker
        now = datetime.now()
        self.year = now.year
        if now.month < 3:
            self.year = self.year - 1

    def execute(self):
        """
        Execute the crawler
        :return: list of courses
        """
        pages = self.get_max_page()
        course_pages = run_concurrently(self.scrape_catalog, range(pages), self.worker)
        course_ids = (course_id for page in course_pages for course_id in page)
        results = run_concurrently(self.scrape_course, course_ids, self.worker)
        return results

    def get_max_page(self):
        """
        Get the max page number for a department
        :return: int
        """
        url = build_url(self.school, 1, 'en')
        body = requests.urlopen(url).read()
        try:
            last = html.fromstring(body).xpath(query["page_num"])[-1]
        except IndexError:
            return 1
        return int(last)

    def scrape_catalog(self, page):
        """
        Get all the course id listed in a page
        :param page: page number (starts from 1)
        :return: list of course ids
        """
        req = requests.Request(url=build_url(self.school, page + 1, 'en', self.year), headers=header)
        resp = requests.urlopen(req).read()
        clist = html.fromstring(resp).xpath(query["course_list"])
        return [re.search(r"\w{28}", clist[i].xpath(query["course_id"])[0]).group(0) for i in range(1, len(clist))]

    def scrape_course(self, course_id):
        """
        Get the detail of a course
        :param course_id:
        :return: dict :=
            {
                "a": 'string', # id
                "b": 'string', # title
                "c": 'string' # title_jp
                "d": 'string', # instructor
                "e": 'string', # instructor_jp
                "f": 'enum', # lang
                "g": 'enum', # type
                "h": 'enum', # term
                "i": [{ # occurrences
                                "d":'integer', # day
                                "p":'integer', # period
                                "l":'string' # location
                                }],
                "j": 'int', # min_year
                "k": 'enum', # category
                "l": 'int', # credit
                "m": 'enum', # level
                "n": 'array', # eval
                "o": 'string', # code
                "p": 'string', # subtitle
            }
        """
        req_en = requests.Request(url=build_url(lang='en', course_id=course_id), headers=header)
        req_jp = requests.Request(url=build_url(lang='jp', course_id=course_id), headers=header)
        parsed_en = html.fromstring(requests.urlopen(req_en).read())
        parsed_jp = html.fromstring(requests.urlopen(req_jp).read())
        info_en = parsed_en.xpath(query["info_table"])[0]
        info_jp = parsed_jp.xpath(query["info_table"])[0]
        # TODO optimize code structure
        locations = scrape_info(info_en, 'classroom', parse_location)
        periods = scrape_info(info_en, 'occurrence', parse_period)
        return {
            "a": course_id,
            "b": scrape_info(info_en, 'title', to_half_width),
            "c": scrape_info(info_jp, 'title', to_half_width),
            "d": scrape_info(info_en, 'instructor', to_half_width),
            "e": scrape_info(info_jp, 'instructor', to_half_width),
            "f": scrape_info(info_en, 'lang', parse_lang),
            "g": scrape_info(info_jp, 'type', to_enum(type_enum_map)),
            "h": scrape_info(info_en, 'occurrence', parse_term),
            "i": merge_period_location(periods, locations),
            "j": scrape_info(info_en, 'min_year', parse_min_year),
            "k": scrape_info(info_en, 'category', to_half_width),
            "l": scrape_info(info_en, 'credit', parse_credit),
            "m": scrape_info(info_jp, 'level', to_enum(level_enum_map)),
            "n": get_eval_criteria(parsed_en),
            "o": scrape_info(info_jp, 'code', None),
            "p": scrape_text(parsed_en, "Subtitle", to_half_width),
            "q": scrape_info(info_jp, 'category', to_half_width),
            "r": scrape_info(info_jp, 'modality', to_enum(modality_enum_map)),
        }
