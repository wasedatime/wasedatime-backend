#!/usr/bin/env bash

cd src/lambda/syllabus-scraper || exit 1
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

cd src/slack-webhook-ppublisher || exit 1
zip -r9 ./function.zip .
cd "$TRAVIS_BUILD_DIR" || exit 1
