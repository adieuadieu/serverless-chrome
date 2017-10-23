#!/bin/sh
# shellcheck shell=dash

#
# Checks latest browser versions and updates configurations and commits to repo
#
# Requires git, curl and jq.
#
# Usage: ./update-browser-versions.sh
#

set -e

cd "$(dirname "$0")/../"

# upload zipped builds
cd packages/lambda/builds

for BUILD in */Dockerfile; do
  BUILD_NAME="${BUILD%%/*}"
    (
      cd "$BUILD_NAME"

      CURRENT_VERSION=$(jq -r ".stable" version.json)
      LATEST_VERSION=$(./latest.sh)

      if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
        echo "$BUILD_NAME has new version $LATEST_VERSION. Updating configuration ..."
        JSON=$(jq -r ".stable |= \"$LATEST_VERSION\"" version.json) && echo "$JSON" > version.json

        git add version.json
        git commit -m "chore ($BUILD_NAME): bump version to $LATEST_VERSION"
        git push
        
      else
        echo "$BUILD_NAME version $CURRENT_VERSION is up to date."
      fi
    )
done
