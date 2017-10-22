#!/bin/sh
# shellcheck shell=dash

#
# Runs a simple integration-test lambda handler in Docker
#
# Requires Docker
#
# Usage: ./integration-test.sh
#

npm run postinstall
npm run build

docker run \
  -v "$PWD/integration-test":/var/task \
  -v "$PWD/dist":/var/task/dist \
  lambci/lambda:nodejs6.10 \
  handler.run
