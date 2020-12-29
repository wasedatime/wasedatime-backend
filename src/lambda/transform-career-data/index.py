import csv
import json
import sys
from io import StringIO
from transform_career_data import transformer

if __name__ == '__main__':
    # Read CSV String-Input
    print('Input the CSV string (press ENTER after inserted all string):')
    csv_string = """"""
    for line in sys.stdin:
        if "" == line.rstrip(): break  # add one blank line to terminate input process
        csv_string = csv_string + str(line)
    with StringIO(csv_string) as csvDocs:
        csvReader = csv.DictReader(csvDocs)
        info_list = transformer(csvReader)

    # Write JSON Files
    json_file_path = r'file/data.json'
    with open(json_file_path, 'w', encoding='utf-8') as jsonFile:
        jsonFile.write(json.dumps(info_list))
