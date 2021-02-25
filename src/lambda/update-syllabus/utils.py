from const import *

class Course:
    def __init__(self,data):
        self.id = data["a"]
        self.data = data

def create_db_item(new_course,school):
    item = {
        s3_to_dynamo["a"] : new_course.data["a"],
        s3_to_dynamo["b"] : new_course.data["b"],
        s3_to_dynamo["c"] : new_course.data["c"],
        s3_to_dynamo["d"] : new_course.data["d"],
        s3_to_dynamo["e"] : new_course.data["e"],
        s3_to_dynamo["f"] : new_course.data["f"],
        s3_to_dynamo["g"] : new_course.data["g"],
        s3_to_dynamo["h"] : new_course.data["h"],
        s3_to_dynamo["i"] : new_course.data["i"],
        s3_to_dynamo["j"] : new_course.data["j"],
        s3_to_dynamo["k"] : new_course.data["k"],
        s3_to_dynamo["l"] : new_course.data["l"],
        s3_to_dynamo["m"] : new_course.data["m"],
        s3_to_dynamo["n"] : new_course.data["n"],
        s3_to_dynamo["o"] : new_course.data["o"],
        s3_to_dynamo["p"] : new_course.data["p"],
        "school" : school
    }
    return item

def update_course(new_course,table,school):
    #test
    print("update course{}",new_course.data['a'])
    response = table.update_item(
            Key={
                'id' : new_course.data["a"]
            },
            UpdateExpression="SET title=:b, title_jp=:c, instructor=:d, instructor_jp=:e, \
            lang=:f, #tp=:g, term=:h, occurrences=:i, min_year=:j, category=:k, credit=:l, \
            #lv=:m, #ev=:n, #cd=:o, subtitle=:p ,school=:s",
            ExpressionAttributeNames = {
		        '#tp': 'type',
		        '#cd': 'code',
		        '#lv': 'level',
		        '#ev': 'eval'
            },
            ExpressionAttributeValues = {
                ':b': new_course.data['b'],
                ':c': new_course.data['c'],
                ':d': new_course.data['d'],
                ':e': new_course.data['e'],
                ':f': new_course.data['f'],
                ':g': new_course.data['g'],
                ':h': new_course.data['h'],
                ':i': new_course.data['i'],
                ':j': new_course.data['j'],
                ':k': new_course.data['k'],
                ':l': new_course.data['l'],
                ':m': new_course.data['m'],
                ':n': new_course.data['n'],
                ':o': new_course.data['o'],
                ':p': new_course.data['p'],
                ':s': school
            },
            ReturnValues="UPDATED_NEW"
        )
    

def insert_course(new_course,table,school):
    #test
    print("Insert course:",new_course.data['a'])
    response = table.put_item(Item=create_db_item(new_course,school))
    return response
