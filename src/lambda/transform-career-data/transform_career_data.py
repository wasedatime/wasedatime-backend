import pytz
import uuid
from datetime import datetime


def raise_key_error(msg=''):
    raise KeyError(msg)
    return None


def error_handler(f):
    def handling(*args):  # or row
        try:
            obj = f(*args)  # args, kwargs
            return obj
        except ValueError:
            print("Value Error Occurred!")
        except AttributeError:
            print("Attribute Error Occurred!")
        except KeyError:
            print("Some requires attribute not provided")

    return handling


def transformer(csv_file):
    info_list = []
    for row in csv_file:
        obj = transforming(row)
        if obj is not None: info_list.append(obj)
    return info_list


@error_handler
def transforming(row):
    info = dict()  # data from each row (Dictionary)

    categories_dict = dict(zip(['internship', 'part_time', 'information_section'], range(3)))
    if categories_dict[row['categories']] is not None:
        info['categories'] = categories_dict[row['categories']]
    else:
        raise_key_error("categories_error")

    info['title'] = row['title'] or raise_key_error("Title missing/wrong_formatted")

    info['description'] = row['description'] or raise_key_error("Description missing/wrong_formatted")

    info['url'] = row['url']

    industry_dict = dict(zip(['maker', 'service', 'finance', 'office', 'it', 'consulting'], range(6)))
    if industry_dict[row['industry']] is not None:
        info['industry'] = industry_dict[row['industry']]
    else:
        raise_key_error("Industry missing/wrong_formatted")

    target_major_dict = {"science": 0, "humanities": 1, "both": 2, "": -1}
    info['target_major'] = target_major_dict[row['target_major']]

    info['requirement'] = row['requirement'] or raise_key_error("Requirement missing/wrong_formatted")

    shift_dict = {"temporary": 0, "1day/week": 1, "2day/week": 2, "over_3day/week": 3, "": -1}
    info['shift'] = shift_dict[row['shift']]

    if row['duration'] == '':
        info['duration'] = -1
    else:
        info['duration'] = int(row['duration'])

    info['corporation'] = row['corporation'] or raise_key_error("Corporation name missing/wrong_formatted")

    info['location'] = row['location'] or raise_key_error("Location missing/wrong_formatted")

    salary_dict = {"over_1000": 0, "over_2000": 1, "over_3000": 2, "others": 3, "": -1}
    info['salary'] = salary_dict[row['salary']]

    language_dict = {"japanese": 0, "english": 1, "bilingual": 2, "others": 3, "": -1}  # Allow language to be None
    info['language'] = language_dict[row['language']]

    if row['deadline'] == '':
        info['deadline'] = ''
    else:
        read_time = datetime.strptime(row['deadline'],
                                      "%Y-%m-%d %H:%M:%S")  # Check date time to right format (if it cannot convert str to date = err occured)
        jp_time = pytz.timezone('Asia/Tokyo').localize(read_time, is_dst=None)
        info['deadline'] = jp_time.astimezone(pytz.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # add deadline if no Value Error

    ID = uuid.uuid4()  # UUID type 'random'
    info['id'] = str(ID)

    time = datetime.now().utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    info['date_updated'] = time

    return info
