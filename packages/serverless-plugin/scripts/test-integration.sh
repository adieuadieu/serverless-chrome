#!/bin/sh
# shellcheck shell=dash

#
# Runs a simple integration-test lambda handler in Docker
#
# Requires Docker, jq
#
# Usage: ./integration-test.sh
#

set -e

cd "$(dirname "$0")/.."

# PACKAGE_DIRECTORY=$(pwd)
TEST_DIRECTORY=".test"

npm run build

cd integration-test

./node_modules/.bin/serverless package
unzip -o -d "$TEST_DIRECTORY" .serverless/**.zip

CHROMIUM_VERSION=$(docker run \
  -v "$PWD/$TEST_DIRECTORY":/var/task \
  lambci/lambda:nodejs6.10 \
  src/handler.default | \
  jq -re '.versionInfo.Browser')

rm -Rf "$TEST_DIRECTORY"

echo "Chromium version $CHROMIUM_VERSION"
