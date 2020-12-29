#!/usr/bin/env bash

cdk deploy --all --require-approval "never"
bash export_api_doc.sh