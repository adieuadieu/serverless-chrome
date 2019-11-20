#!/bin/sh
# shellcheck shell=dash

#
# Runs a simple integration-test lambda handler in Docker
#
# Requires Docker
#
# Usage: ./integration-test.sh [stable|beta|dev]
#

set -e

cd "$(dirname "$0")/.."

CHANNEL=${1:-stable}

if [ ! -d "dist/" ]; then
  ./scripts/package-binaries.sh chromium "$CHANNEL"
  npm run build
fi

(cd integration-test &&  npm install)

docker run \
  -v "$PWD/integration-test":/var/task \
  -v "$PWD/dist":/var/task/dist \
  lambci/lambda:nodejs8.10 \
  handler.run \
  "{\"channel\": \"$CHANNEL\"}"
