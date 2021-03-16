import itertools
import json
import logging
import re
import unicodedata
import urllib.request as requests
from const import *
from decimal import Decimal
from lxml import html


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return json.JSONEncoder.default(self, obj)


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
        return json.dumps(self.payload, cls=DecimalEncoder, ensure_ascii=False).encode('utf8')


def api_response(code, body):
    return {
        "isBase64Encoded": False,
        "statusCode": code,
        'headers': {
            "Access-Control-Allow-Origin": '*',
            "Content-Type": "application/json",
            "Referrer-Policy": "origin"
        },
        "multiValueHeaders": {"Access-Control-Allow-Methods": ["OPTIONS", "GET"]},
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


def build_url(lang, course_id):
    """
    Constructs the url of course catalog page or course detail page(if course id is present)
    :param year: year
    :param course_id: course id
    :param dept: department code
    :param page: page number
    :param lang: language ('en', 'jp')
    :return: str
    """
    return f"https://www.wsl.waseda.jp/syllabus/JAA104.php?pKey={course_id}&pLng={lang}"


def scrape_course(course_id):
    req_en = requests.Request(url=build_url('en', course_id))
    req_jp = requests.Request(url=build_url('jp', course_id))
    parsed_en = html.fromstring(requests.urlopen(req_en).read())
    parsed_jp = html.fromstring(requests.urlopen(req_jp).read())
    info_en = parsed_en.xpath(query["info_table"])[0]
    info_jp = parsed_jp.xpath(query["info_table"])[0]
    # TODO optimize code structure
    locations = scrape_info(info_en, 'classroom', parse_location)
    periods = scrape_info(info_en, 'occurrence', parse_period)
    return {
        "id": course_id,
        "title": scrape_info(info_en, 'title', to_half_width),
        "title_jp": scrape_info(info_jp, 'title', to_half_width),
        "instructor": scrape_info(info_en, 'instructor', to_half_width),
        "instructor_jp": scrape_info(info_jp, 'instructor', to_half_width),
        "lang": scrape_info(info_en, 'lang', parse_lang),
        "type": scrape_info(info_jp, 'type', to_enum(type_enum_map)),
        "term": scrape_info(info_en, 'occurrence', parse_term),
        "occ": merge_period_location(periods, locations),
        "year": scrape_info(info_en, 'min_year', parse_min_year),
        "cat": scrape_info(info_en, 'category', to_half_width),
        "cred": scrape_info(info_en, 'credit', parse_credit),
        "lvl": scrape_info(info_jp, 'level', to_enum(level_enum_map)),
        "eval": get_eval_criteria(parsed_en),
        "code": scrape_info(info_jp, 'code', None),
        "sub": scrape_text(parsed_en, "Subtitle", to_half_width),
        "cat_jp": scrape_info(info_jp, 'category', to_half_width),
        "mod": scrape_info(info_jp, 'modality', to_enum(modality_enum_map)),
        "outline": scrape_text(parsed_en, "Course Outline", to_half_width),
        "obj": scrape_text(parsed_en, "Objectives", to_half_width),
        "self_study": scrape_text(parsed_en, "before/after course of study", to_half_width),
        "schedule": scrape_text(parsed_en, "Course Schedule", to_half_width),
        "text": scrape_text(parsed_en, "Textbooks", to_half_width),
        "ref": scrape_text(parsed_en, "Reference", to_half_width),
        "note": scrape_text(parsed_en, "Note / URL", to_half_width),
    }


def scrape_info(parsed, key, fn):
    """
    Extract info from parsed and let it processed by fn
    :param parsed: parsed html section
    :param key: category of info
    :param fn: function used to transform data
    :return: scraped information
    """
    section = parsed.xpath(query[key])
    # special cases if modality not present
    if (key == "code" or key == "level" or key == "type") and scrape_info(parsed, 'modality',
                                                                          to_enum(modality_enum_map)) == -1:
        section = parsed.xpath(query[f"{key}_old"])
    if section:
        if not fn:
            return section[0]
        return fn(section[0])
    return ""


def to_half_width(s):
    """
    Converts zenkaku to hankaku
    :param s:
    :return:
    """
    if not s:
        return ""
    return unicodedata.normalize('NFKC', s)


def get_eval_criteria(parsed):
    """
    Get the evaluation criteria from course detail page
    :return: array :=
        [{
            "t": 'enum' # type
            "p": 'int' # percent
            "c": 'string' #criteria
        }]
    """
    table = get_syllabus_texts(parsed, "Evaluation")
    if table is None:
        return []
    evals = []
    rows = table.xpath('table//tr')
    # Case 1: the only row is the table header
    if len(rows) < 2:
        return table.text_content()
    # Case 2: 2 or more rows
    for r in rows[1:]:
        elem = r.getchildren()
        kind = elem[0].text
        percent = elem[1].text.strip()[:-1] or -1
        try:
            percent = int(percent)
        except ValueError:
            logging.warning(f"Unable to parse percent: {percent}")
        criteria = to_half_width(elem[2].text)
        evals.append({
            "type": to_enum(eval_type_map)(kind),
            "percent": percent,
            "criteria": criteria
        })
    return evals


def scrape_text(parsed, row_name, fn):
    element = get_syllabus_texts(parsed, row_name)
    if element is not None:
        for br in element.xpath("*//br"):
            br.tail = "\n" + br.tail if br.tail else "\n"
        return fn(element.text_content())
    return ""


def get_syllabus_texts(course_html, row_name=None):
    """
    Get all the "Syllabus Information" in course details page
    :param row_name: the name of which row to extract
    :param course_html: parsed html
    :return: dict:=
        {
            row1_name: row1_content,
            ...
        }
        or an Element if row_name is specified
        or None if nothing matched
    """
    if course_html is None:
        return None
    rows = course_html.xpath(query["text_table"])
    row_names = [(row.xpath(query["row_name"]) or [""])[0] for row in rows]
    for i in range(len(row_names)):
        if row_name == row_names[i]:
            content = rows[i].xpath(query["row_content"])
            if content:
                return content[0]
            return None
    return None


def merge_period_location(periods, locations):
    """
    Join location with period
    :param periods: list
    :param locations: list
    :return: array of dict
    """
    occurrences = []
    # Case 1: multiple periods but only one location
    if len(locations) == 1:
        for p in periods:
            p["l"] = locations[0]
        return periods
    # TODO find other cases
    # Case 2: More no. of periods than no. of locations
    zipped = list(itertools.zip_longest(periods, locations))
    for (p, loc) in zipped:
        p["l"] = loc
        occurrences.append(p)
    return occurrences


def parse_min_year(eligible_year):
    """
    Parse minimum eligible year
    :param eligible_year: string
    :return: int
    """
    if not eligible_year:
        return -1
    if eligible_year[0].isdigit():
        return int(eligible_year[0])
    return -1


def parse_location(loc):
    """
    Parse a series of locations
    :param loc: string
    :return: list
    """
    # Case 1: no location
    if loc.isspace():
        return ["undecided"]
    # Case 2: a single location
    if len(loc.split('／')) == 1:
        return [to_half_width(loc)]
    # Case 3: multiple 'period:location' separated by /
    rooms = []
    locations = loc.split('／')
    for l in locations:
        match = re.search(r'0(\d):(.*)', l)
        count, classroom = int(match.group(1)) - 1, match.group(2)
        classroom = to_half_width(classroom)
        # Sub-case: two location records for same period
        if count >= len(rooms):
            rooms.append(classroom)
        else:
            rooms.__setitem__(count, rooms[count] + "/" + classroom)
        return rooms


def parse_lang(lang):
    if lang == "N/A":
        return [-1]
    langs = lang.split('/')
    lang_list = [to_enum(lang_enum_map)(l) for l in langs]
    return lang_list


def parse_term(schedule):
    """
    Parse the term from string 'term  day/period'
    :param schedule: string
    :return: string(encoded_term)
    """
    try:
        (term, _) = schedule.split(u'\xa0\xa0', 1)
    except ValueError:
        logging.warning(f"Unable to parse term from '{schedule}'")
        return "undecided"
    if term not in term_enum_map.keys():
        logging.error(f"Unknown term '{term}'")
        return ""
    return to_enum(term_enum_map)(term)


def parse_period(schedule):
    """
    Extract day and period from raw data
    :param schedule: string
    :return: term and occurrence(list)
    """
    # TODO optimize code structure
    try:
        (_, occ) = schedule.split(u'\xa0\xa0', 1)
    except ValueError:
        logging.warning(f"Unable to parse period: {schedule}")
        return []
    if occ == "othersothers":
        return [{"d": -1, "p": -1}]
    if occ == "othersOn demand":
        return [{"d": -1, "p": 0}]
    occ_matches = re.finditer(r'(Mon|Tues|Wed|Thur|Fri|Sat|Sun)\.(\d-\d|\d|On demand)', occ)
    occurrences = []
    for match in occ_matches:
        day, period = match.group(1), match.group(2)
        day = to_enum(weekday_enum_map)(day)
        if period is None:
            period = -1
        elif period == "On demand":
            period = 0
        elif period.isdigit():
            period = int(period)
        else:
            p1, p2 = period.split('-', 1)
            period = int(p1) * 10 + int(p2)
        occurrences.append({"d": day, "p": period})
    return occurrences


def parse_credit(credit):
    if credit.isdigit():
        return int(credit)
    return -1


def to_enum(enum_map):
    def map_to_int(data):
        if not data:
            return -1
        if data == u'\xa0':
            return -1
        try:
            return enum_map[data]
        except KeyError:
            logging.warning(f"Unable to map '{data}' to integer")
            return -1

    return map_to_int
