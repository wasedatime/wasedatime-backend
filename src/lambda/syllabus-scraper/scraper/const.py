import random

school_name_map = {
    "PSE": {"jp": "政経", "en": "Schl Political Sci/Econo", "param": "111973"},
    "LAW": {"jp": "法学", "en": "Schl Law", "param": "121973"},
    "EDU": {"jp": "教育", "en": "Schl Edu", "param": "151949"},
    "SOC": {"jp": "商学", "en": "Schl Commerce", "param": "161973"},
    "SSS": {"jp": "社学", "en": "Schl Social Sci", "param": "181966"},
    "HUM": {"jp": "人科", "en": "Schl Human Sci", "param": "192000"},
    "SPS": {"jp": "スポーツ", "en": "Schl Sport Sci", "param": "202003"},
    "SILS": {"jp": "国際教養", "en": "SILS", "param": "212004"},
    "CMS": {"jp": "文構", "en": "SCMS", "param": "232006"},
    "HSS": {"jp": "文", "en": "SHSS", "param": "242006"},
    "EHUM": {"jp": "人通", "en": "Schl Human Sci (CC)", "param": "252003"},
    "FSE": {"jp": "基幹", "en": "Schl of Fund Sci/Eng", "param": "262006"},
    "CSE": {"jp": "創造", "en": "Schl Cre Sci/Eng", "param": "272006"},
    "ASE": {"jp": "先進", "en": "Schl Adv Sci/Eng", "param": "282006"},
    "G_PS": {"jp": "政研", "en": "G.S. Political Sci", "param": "311951"},
    "G_E": {"jp": "経研", "en": "G.S. Econo", "param": "321951"},
    "G_LAW": {"jp": "法研", "en": "G.S. Law", "param": "331951"},
    "G_LAS": {"jp": "文研", "en": "G.S. Letters", "param": "342002"},
    "G_SC": {"jp": "商研", "en": "G.S. Commerce", "param": "351951"},
    "G_EDU": {"jp": "教研", "en": "G.S. Edu", "param": "371990"},
    "G_HUM": {"jp": "人研", "en": "G.S. Human Sci", "param": "381991"},
    "G_SSS": {"jp": "社学研", "en": "G.S. Social Sci", "param": "391994"},
    "G_SAPS": {"jp": "アジア研", "en": "GSAPS", "param": "402003"},
    "G_ITS": {"jp": "国情研", "en": "GITS", "param": "422000"},
    "G_SJAL": {"jp": "日研", "en": "GSJAL", "param": "432001"},
    "G_IPS": {"jp": "情シス研", "en": "IPS", "param": "442003"},
    "G_WOSPM": {"jp": "公共研", "en": "WOSPM", "param": "452003"},
    "G_WLS": {"jp": "法務研", "en": "Law Schl", "param": "472004"},
    "G_SA": {"jp": "会計研", "en": "WGSA", "param": "482005"},
    "G_SPS": {"jp": "スポーツ研", "en": "G.S. Sport Sci", "param": "502005"},
    "G_FSE": {"jp": "基幹研", "en": "G.S. Fund Sci/Eng", "param": "512006"},
    "G_CSE": {"jp": "創造研", "en": "G.S. Cre Sci/Eng", "param": "522006"},
    "G_ASE": {"jp": "先進研", "en": "G.S. Adv Sci/Eng", "param": "532006"},
    "G_SEEE": {"jp": "環エネ研", "en": "G.S. EEE", "param": "542006"},
    "G_SICCS": {"jp": "国際コミ研", "en": "GSICCS", "param": "562012"},
    "G_WBS": {"jp": "経管研", "en": "WBS", "param": "572015"},
    "ART": {"jp": "芸術", "en": "Art/Architecture Schl", "param": "712001"},
    "CJL": {"jp": "日本語", "en": "CJL", "param": "922006"},
    "CIE": {"jp": "留学", "en": "CIE", "param": "982007"},
    "GEC": {"jp": "グローバル", "en": "Global", "param": "9S2013"}
}

location_name_map = {
    "61号館2階": "61-2F",
    "61号館BF": "61-BF",
    "Business Design & Management labo 61-2F": "61-2F Business Design & Management lab",
    "foyer 50-301": "50-301",
    "Seminar room 3 50-304": "50-304",
    "255B教室": "61-255B",
    "711教室": "51-711",
    "５８-３Ｆ　社工演習室": "58-3F",
    "801教室": "51-801",
    "3-201(Center for Teaching,Learning, and Technology Active Learning)": "3-201",
    "3-202(Center for Teaching,Learning, and Technology Active Learning)": "3-202",
    "3-203(Center for Teaching,Learning, and Technology Active Learning)": "3-203",
    "806共同利用研究室7": "14-806",
    "504(コンピュータ教室)科学技術計算": "14-504",
    "408(コンピュータ教室)": "16-408",
    "6-318(博物館実習室)": "6-318",
    "１４-Ｂ１０３教育学部図書館学実習室": "14-B103",
    "14-810(院生指導室)": "14-810",
    "６１-２５５Ｂ教室": "61-255B",
    "14-806共同利用研究室7": "14-806",
    "14-805共同利用研究室6": "14-805",
    "14-807共同利用研究室8": "14-807",
    "14-507共同利用研究室2": "14-507",
    "14-506共同利用研究室1": "14-506",
    "５１-７１１教室": "51-711",
    "11-601　Computer Room 1": "11-601",
    "11-602　Computer Room 2": "11-602",
    "3-901 (SPSE PC Room)": "3-901",
    "60-101(CSE Learning Commons)": "60-101",
    "５１-８０１教室": "51-801",
    "Seminar room 4 50-3011": "50-3011",
    "Seminar room 5 50-3012": "50-3012",
    "14-809(院生指導室)": "14-809",
    "14-808(院生指導室)": "14-808",
    "Seminar room 2 50-303": "50-303",
}

user_agents = [
    "Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 13_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/605.1.15 (KHTML, like Gecko)",
    "Mozilla/5.0 (iPad; CPU OS 9_3_5 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Mobile/13G36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
    "Mozilla/5.0 (Windows NT 5.1; rv:36.0) Gecko/20100101 Firefox/36.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36 Edg/79.0.309.65",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36 Edg/79.0.309.65"
]

header = {
    "Host": "www.wsl.waseda.jp",
    "Connection": "keep-alive",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9,ja-JP;q=0.8,ja;q=0.7",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Pragma": "no-cache",
    "User-Agent": random.choice(user_agents)
}

query = {
    # used in course catalog page
    "page_num": "//table[@class='t-btn']//table[@class='t-btn']//a/text()",
    "course_list": "//table[@class='ct-vh']//tbody/tr",
    "course_id": "td[3]/a[1]/@onclick",
    # used in course detail page
    "info_table": "//div[@id='cEdit']//div[1]//div[1]//div[1]//div[1]//div[1]//div[2]//table[1]//tbody[1]",
    "title": "tr[2]/td[1]/div[1]/text()",
    "instructor": "tr[3]/td[1]/text()",
    "occurrence": "tr[4]/td[1]/text()",
    "category": "tr[5]/td[1]/text()",
    "min_year": "tr[5]/td[2]/text()",
    "credit": "tr[5]/td[3]/text()",
    "classroom": "tr[6]/td[1]/text()",
    "campus": "tr[6]/td[2]/text()",
    "lang": "tr[8]/td[1]/text()",
    "code": "tr[9]/td[1]/text()",
    "level": "tr[13]/td[1]/text()",
    "type": "tr[13]/td[2]/text()",
    "text_table": "/html[1]/body[1]/form[1]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[1]/div[1]/"
                  "div[1]/div[2]/div[2]/div[1]/div[2]/div[1]/div[1]/div[1]/div[1]/div[2]/table[1]/tbody[1]/tr",
    "row_name": "th[1]/text()",
    "row_content": "td[1]"
}

eval_type_map = {
    "Exam:": 0,
    "Papers:": 1,
    "Class Participation:": 2,
    "Others:": 3
}

type_enum_map = {
    "N/A": -1,
    "Lecture": 0,
    "Seminar": 1,
    "Work": 2,
    "Foreign Language": 3,
    "On-demand": 4,
    "Thesis": 5,
    "Graduate Research": 6,
    "Practice": 7,
    "Blended": 8
}

level_enum_map = {
    "N/A": -1,
    "Beginner, initial or introductory": 0,
    "Intermediate, developmental and applicative": 1,
    "Advanced, practical and specialized": 2,
    "Final stage advanced-level undergraduate": 3,
    "Level of Master": 4,
    "Level of Doctor": 5
}

term_enum_map = {
    "spring semester": "0s",
    "fall semester": "2s",
    "spring quarter": "0q",
    "summer quarter": "1q",
    "fall quarter": "2q",
    "winter quarter": "3q",
    "full year": "f",
    "spring": "0",
    "summer": "1",
    "fall": "2",
    "winter": "3",
    "an intensive course(spring)": "0i",
    "an intensive course(fall)": "2i",
    "spring term": "0t",
    "summer term": "1t",
    "fall term": "2t",
    "winter term": "3t",
    "spring term／summer term": "0t/1t",
    "spring semester／fall semester": "0s/2s",
    "fall term／winter term": "2t/3t",
    "summer and fall semester": "1&2s",
    "spring semester and summer": "0s&1",
    "full year／fall semester": "f/2s",
    "an intensive course(spring and fall)": "0i&3i"
}

weekday_enum_map = {
    'Sun': 0,
    'Mon': 1,
    'Tues': 2,
    'Wed': 3,
    'Thur': 4,
    'Fri': 5,
    'Sat': 6
}

lang_enum_map = {
    'N/A': -1,
    'Japanese': 0,
    'English': 1,
    'German': 2,
    'French': 3,
    'Chinese': 4,
    'Spanish': 5,
    'Korean': 6,
    'Russian': 7,
    'Italian': 8,
    'other': 9
}
