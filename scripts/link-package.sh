#!/bin/sh
# shellcheck shell=dash

#
# Link packages
#
# Usage: ./link-packages.sh packageDirectory linkedDependencyDirectory
#

set -e

cd "$(dirname "$0")/../"

PROJECT_DIRECTORY=$(pwd)
PACKAGE_PATH=$1
LINKED_PACKAGE=$2

# cd packages/

# for PACKAGE in */package.json; do
#   PACKAGE_NAME="${PACKAGE%%/*}"
#   cd "$PROJECT_DIRECTORY/packages/$PACKAGE_NAME" || exit 1
#   npm link
# done


cd "$PROJECT_DIRECTORY/$PACKAGE_PATH"
npm link "$PROJECT_DIRECTORY/packages/$LINKED_PACKAGE"
