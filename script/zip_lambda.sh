#!/usr/bin/env bash

# todo make function for different deploy methods

cd src/lambda || exit 1
git clone https://github.com/wasedatime/syllabus-scraper.git
cd syllabus-scraper || exit 1
virtualenv myvenv
source myvenv/bin/activate
pip install -r requirements.txt
deactivate
cd myvenv/lib/python3.8/site-packages || exit 1
zip -r9 "${OLDPWD}"/function.zip .
cd "$OLDPWD" || exit 1
zip -g function.zip syllabus_scraper.py
zip -g -r function.zip scraper
cd "$TRAVIS_BUILD_DIR" || exit 1

cd src/get-reviews || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1

cd src/put-reviews || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1

cd src/amplify-status-publisher || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1

cd src/sfn-status-publisher || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1

cd src/signup-validator || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1
