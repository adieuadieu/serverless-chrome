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

PACKAGE_DIRECTORY=$(pwd)
UPDATES=0

cd packages/lambda/builds

for BUILD in */Dockerfile; do
  BUILD_NAME="${BUILD%%/*}"
    cd "$BUILD_NAME" || exit

    CURRENT_VERSION=$(jq -r ".stable" version.json)
    LATEST_VERSION=$(./latest.sh)

    if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
      echo "$BUILD_NAME has new version $LATEST_VERSION. Updating configuration ..."
      
      JSON=$(jq -r ".stable |= \"$LATEST_VERSION\"" version.json)
      echo "$JSON" > version.json

      git add version.json
      git commit -m "chore ($BUILD_NAME): bump version to $LATEST_VERSION" --no-verify

      UPDATES=$((UPDATES + 1))
    else
      echo "$BUILD_NAME version $CURRENT_VERSION is already latest. Nothing to update."
    fi

    cd ../
done

cd "$PACKAGE_DIRECTORY"

# If there are new browser versions we create a new version
if [ "$UPDATES" != "0" ]; then
  npm version prerelease --no-git-tag-version # @TODO: change to 'minor' if stable-channel, otherwise `pre-release`?
  
  PROJECT_VERSION=$(jq -r ".version" package.json)
  
  git commit -a -m "v$PROJECT_VERSION"
  git tag "v$PROJECT_VERSION"
  git push
  git push --tags
fi
