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

  CHANNEL_LIST=$(jq -r ". | keys | tostring" ./version.json | sed -e 's/[^A-Za-z,]//g' | tr , '\n')

  while IFS= read -r CHANNEL; do
    # Skip empty lines and lines starting with a hash (#):
    [ -z "$CHANNEL" ] || [ "${CHANNEL#\#}" != "$CHANNEL" ] && continue

    OUR_VERSION=$(jq -r ".$CHANNEL" version.json)
    LATEST_VERSION=$(./latest.sh "$CHANNEL")

    if [ "$OUR_VERSION" != "$LATEST_VERSION" ]; then
      STATUS="new; our version is $OUR_VERSION"
    else
      STATUS="current"
    fi

    echo "$CHANNEL: $LATEST_VERSION ($STATUS)"
  done << EOL
$CHANNEL_LIST
EOL
}

if [ ! -z "$1" ]; then
  version "$1"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */latest.sh; do
    version "${DOCKER_FILE%%/*}"
  done
fi
