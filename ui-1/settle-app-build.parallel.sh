#!/bin/bash
set -e

#NOTE: this script should be executed from the root of the repository

script_path="$(realpath -s $0)"
script_directory="$(dirname "$script_path")"

echo "Build Script Initiated"
echo "Working Directory: $PWD"
echo "Script Path: $script_path"
echo "Script Directory: $script_directory"

source "$PWD/scripts/modules/args-parser.sh"

if [ -z "$configuaration" ]; then configuaration="Release" ; fi;

echo "Build Configuration: $configuaration"
echo "Building all projects in script directory..."

OIFS="$IFS"
IFS=$'\n'
files=$(find "$script_directory" -type f -name "package.json")
for f in $files; do
	dirRoot=$(dirname "${f}")
	echo "Found package json file '$f' executing npm install for dir $dirRoot...";
	base=$PWD
	echo "## Executiong npm install for dir $1...";
	cd $dirRoot
	npm install
  npm run build
	cd $base
done
IFS="$OIFS"

echo "Build Script Finished Running."
