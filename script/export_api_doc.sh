#!/usr/bin/env bash

install_awscliv2() {
  cd "$TRAVIS_BUILD_DIR" || exit 1
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  unzip awscliv2.zip
  sudo ./aws/install
}

export_api_doc() {
  aws apigateway get-export --rest-api-id 'anvonkl0fd' --stage-name 'dev' --export-type 'swagger' --accepts 'application/yaml' ./dev.yml
  aws apigateway get-export --rest-api-id 'anvonkl0fd' --stage-name 'prod' --export-type 'swagger' --accepts 'application/yaml' ./prod.yml
}

setup_git() {
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

install_awscliv2
setup_git
export_api_doc
upload_doc
