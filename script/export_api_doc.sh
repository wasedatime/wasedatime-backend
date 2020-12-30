#!/usr/bin/env bash

export_api_doc() {
  pyenv global 3.7.1
  pip install -U pip
  pip install awscli
  aws apigateway --rest-api-id 'anvonkl0fd' --stage-name 'dev' --export-type 'swagger' --accepts 'application/yaml' ./dev.yml
  aws apigateway --rest-api-id 'anvonkl0fd' --stage-name 'prod' --export-type 'swagger' --accepts 'application/yaml' ./prod.yml
}

setup_git() {
  cd "$TRAVIS_BUILD_DIR" || exit 1
  git config --global user.email "travis@travis-ci.com"
  git config --global user.name "Travis CI"
  git clone https://"${TRAVIS_GITHUB_TOKEN}"@github.com/wasedatime/wasedatime-openapi.git
  cd wasedatime-openapi/openapi || exit 1
}

upload_doc() {
  git add *.yml
  git commit --message "API Documentation update by Travis CI (Build #$TRAVIS_BUILD_NUMBER)"
  git push --quiet
}

setup_git
export_api_doc
upload_doc
