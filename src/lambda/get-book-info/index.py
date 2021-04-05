import json
from utils import JsonPayloadBuilder
from utils import build_queries
from utils import get_books
from utils import resp_handler


@resp_handler
def analyze_book(text):
    queries = build_queries(text)
    books = get_books(queries)
    resp_body = JsonPayloadBuilder().add_status(True).add_data(books).add_message('').compile()
    return resp_body


def handler(event, context):
    body = json.loads(event['body'])
    params = {
        "text": body["data"]
    }

    return analyze_book(**params)

def main():
    with open('/home/youenn98/wasedatimenew/wasedatime-backend/src/lambda/get-book-info/text.txt','r',encoding='utf-8') as f:
        contents = f.read()
    
    books_queries = build_queries(contents)
    for q in books_queries:
        print(q)

if __name__ == "__main__":
    main()