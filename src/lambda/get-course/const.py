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
    "modality": "tr[9]/td[1]/text()",
    "code": "tr[10]/td[1]/text()",
    "code_old": "tr[9]/td[1]/text()",
    "level": "tr[14]/td[1]/text()",
    "level_old": "tr[13]/td[1]/text()",
    "type": "tr[14]/td[2]/text()",
    "type_old": "tr[13]/td[2]/text()",
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
    "指定なし": -1,
    "講義": 0,
    "演習／ゼミ": 1,
    "実習／実験／実技": 2,
    "外国語": 3,
    "オンデマンド": 4,
    "論文": 5,
    "研究指導": 6,
    "実践／フィールドワーク／インターンシップ／ボランティア": 7,
    "対面／オンデマンド": 8
}

level_enum_map = {
    "指定なし": -1,
    "初級レベル（入門・導入）": 0,
    "中級レベル（発展・応用）": 1,
    "上級レベル": 2,
    "総仕上げ": 3,
    "修士レベル": 4,
    "博士レベル": 5
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
    'other': 9,
    'Language Course': 9
}

modality_enum_map = {
    "対面": 0,
    "フル対面": 0,
    "ハイブリッド（対面／オンライン併用）": 1,
    "複合（対面/オンデマンド/リアルタイム配信/課題提出）": 1,
    "フルオンデマンド（曜日時限なし）": 2,
    "フルオンデマンド（コロナ）": 2,
    "フルオンデマンド（既存）": 2,
    "オンデマンド（曜日時限あり）": 3,
    "オンデマンド": 3,
    "リアルタイム配信": 4
}
