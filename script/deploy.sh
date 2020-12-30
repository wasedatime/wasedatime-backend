#!/usr/bin/env bash

cdk deploy --all --require-approval "never"
bash script/export_api_doc.sh
