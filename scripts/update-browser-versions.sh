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

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

UPDATES=0


# on CircleCI, setup git user email & name
if [ -z "$(git config user.email)" ] && [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.email "$GIT_USER_EMAIL"
fi

if [ -z "$(git config user.name)" ] && [ -n "$GIT_USER_NAME" ]; then
    git config --global user.name "$GIT_USER_NAME"
fi

git checkout master


cd "$PACKAGE_DIRECTORY/builds"

for BUILD in */Dockerfile; do
  BUILD_NAME="${BUILD%%/*}"
  
  cd "$BUILD_NAME" || exit

  CHANNEL_LIST=$(jq -r ". | keys | tostring" ./version.json | sed -e 's/[^A-Za-z,]//g' | tr , '\n')
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda

  # Iterate over the channels:
  while IFS= read -r CHANNEL; do
    # Skip empty lines and lines starting with a hash (#):
    [ -z "$CHANNEL" ] || [ "${CHANNEL#\#}" != "$CHANNEL" ] && continue

    CURRENT_VERSION=$(jq -r ".$CHANNEL" version.json)
    LATEST_VERSION=$(./latest.sh "$CHANNEL")

    if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
      if "$PROJECT_DIRECTORY/scripts/docker-image-exists.sh" "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
        echo "$BUILD_NAME has new version $LATEST_VERSION. Updating configuration ..."
        
        JSON=$(jq -r ".$CHANNEL |= \"$LATEST_VERSION\"" version.json)
        echo "$JSON" > version.json

        git add version.json
        git commit -m "chore ($BUILD_NAME): bump $CHANNEL channel version to $LATEST_VERSION" --no-verify

        # Only create new tag/release when stable channel has new version
        if [ "$CHANNEL" = "stable" ]; then
          UPDATES=1
        fi
      else
        echo "Docker image for adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION does not exist. Exiting." && exit 1
      fi
    else
      echo "$BUILD_NAME $CHANNEL version $CURRENT_VERSION is already latest. Nothing to update."
    fi

  done << EOL
$CHANNEL_LIST
EOL

  cd ../
done

cd "$PROJECT_DIRECTORY"

# If there are new browser versions (on the stable channel) we create a new version
if [ "$UPDATES" -eq 1 ]; then
  npm version prerelease --no-git-tag-version # @TODO: change to 'minor' if stable-channel
  
  PROJECT_VERSION=$(jq -r ".version" package.json)
  
  ./scripts/sync-package-versions.sh

  git commit -a -m "v$PROJECT_VERSION"
  git tag "v$PROJECT_VERSION"
  git push --set-upstream origin master
  git push --tags
else
  git push --set-upstream origin master
fi
