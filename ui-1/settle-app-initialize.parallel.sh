#!/bin/bash
set -e

#NOTE: this script should be executed from the root of the repository

script_path="$(realpath -s $0)"
script_directory="$(dirname "$script_path")"
example_secret_path=../../secrets/demo-app-secret-key.aess

echo "Pre-Build Script Initiated"
echo "Working Directory: $PWD"
echo "Script Path: $script_path"
echo "Script Directory: $script_directory"

source "$PWD/scripts/modules/args-parser.sh"

echo "EXAMPLE TEMPLATE OF PRE-BUILD SCRIPT, CAN BE USED TO INSTAL NOT AVAILABLE DEPENDENCIES, UPGRADE CURRENT ONES etc."


CDHelper aes decrypt --key=$example_secret_path --path=$script_directory/example-secret-ui-1.json.aes