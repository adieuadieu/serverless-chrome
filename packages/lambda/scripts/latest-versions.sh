#!/bin/sh
# shellcheck shell=dash

#
# Get current versions of browsers
#
# Requires jq
#
# Usage: ./latest-versions.sh [chromium|firefox]
#

set -e

cd "$(dirname "$0")/.."

PACKAGE_DIRECTORY=$(pwd)

version() {
  BUILD_NAME=$1
  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  echo "--- $BUILD_NAME ---"
  ./latest.sh
}

if [ ! -z "$1" ]; then
  version "$1"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */latest.sh; do
    version "${DOCKER_FILE%%/*}"
  done
fi
