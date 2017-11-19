#!/bin/sh
# shellcheck shell=dash

#
# Creates a GitHub release or pre-release for tagged commits.
#
# Requires git, curl and jq.
#
# Usage: ./release.sh
#

set -e

cd "$(dirname "$0")/../"

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

if [ -z "$GITHUB_TOKEN" ]; then
  printf "Error: Missing %s environment variable.\n" \
    GITHUB_TOKEN >&2
  exit 1
fi

if ! npm whoami -s && [ -z "$NPM_TOKEN" ]; then
  echo "Error: Missing NPM credentials or NPM_TOKEN environment variable." 
  exit 1
fi

ORIGIN_URL=$(git config --get remote.origin.url)
GITHUB_ORG=$(echo "$ORIGIN_URL" | sed 's|.*:||;s|/.*$||')
GITHUB_REPO=$(echo "$ORIGIN_URL" | sed 's|.*/||;s|\.[^\.]*$||')
export GITHUB_ORG
export GITHUB_REPO

# Get the tag for the current commit:
git fetch origin 'refs/tags/*:refs/tags/*'
TAG="$(git describe --exact-match --tags 2> /dev/null || true)"

if [ -z "$TAG" ]; then
  echo "Not a tagged commit. Skipping release.."
  exit
fi

# Check if this is a pre-release version (denoted by a hyphen):
if [ "${TAG#*-}" != "$TAG" ]; then
  PRE=true
else
  PRE=false
fi

RELEASE_TEMPLATE='{
  "tag_name": "%s",
  "name": "%s",
  "prerelease": %s,
  "draft": %s
}'

RELEASE_BODY="This is an automated release.\n\n"

create_release_draft() {
  # shellcheck disable=SC2034
  local ouput
  # shellcheck disable=SC2059
  if output=$(curl \
      --silent \
      --fail \
      --request POST \
      --header "Authorization: token $GITHUB_TOKEN" \
      --header 'Content-Type: application/json' \
      --data "$(printf "$RELEASE_TEMPLATE" "$TAG" "$TAG" "$PRE" true)" \
      "https://api.github.com/repos/$GITHUB_ORG/$GITHUB_REPO/releases");
  then
    RELEASE_ID=$(echo "$output" | jq -re '.id')
    UPLOAD_URL_TEMPLATE=$(echo "$output" | jq -re '.upload_url')
  fi
}

upload_release_asset() {
  # shellcheck disable=SC2059
  curl \
    --silent \
    --fail \
    --request POST \
    --header "Authorization: token $GITHUB_TOKEN" \
    --header 'Content-Type: application/zip' \
    --data-binary "@$1" \
    "${UPLOAD_URL_TEMPLATE%\{*}?name=$2&label=$1" \
    > /dev/null
}

update_release_body() {
  # shellcheck disable=SC2059
  curl \
    --silent \
    --fail \
    --request PATCH \
    --header "Authorization: token $GITHUB_TOKEN" \
    --header 'Content-Type: application/json' \
    --data "{\"body\":\"$RELEASE_BODY\"}" \
    "https://api.github.com/repos/$GITHUB_ORG/$GITHUB_REPO/releases/$1" \
    > /dev/null
}

publish_release() {
  # shellcheck disable=SC2059
  curl \
    --silent \
    --fail \
    --request PATCH \
    --header "Authorization: token $GITHUB_TOKEN" \
    --header 'Content-Type: application/json' \
    --data "{\"draft\":false, \"tag_name\": \"$TAG\"}" \
    "https://api.github.com/repos/$GITHUB_ORG/$GITHUB_REPO/releases/$1" \
    > /dev/null
}

echo "Creating release draft $TAG"
create_release_draft

# upload zipped builds
cd "$PACKAGE_DIRECTORY/builds"

for BUILD in */Dockerfile; do
  BUILD_NAME="${BUILD%%/*}"

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME" || exit 1

  CHANNEL_LIST=$(jq -r ". | keys | tostring" ./version.json | sed -e 's/[^A-Za-z,]//g' | tr , '\n')
  
  while IFS= read -r CHANNEL; do
    # Skip empty lines and lines starting with a hash (#):
    [ -z "$CHANNEL" ] || [ "${CHANNEL#\#}" != "$CHANNEL" ] && continue

    VERSION=$(jq -r ".$CHANNEL" version.json)
    ZIPFILE=$CHANNEL-headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.zip

    (
      if [ ! -f "dist/$ZIPFILE" ]; then
        echo "$BUILD_NAME version $VERSION has not been packaged. Packaging ..."
        ../../scripts/package-binaries.sh "$BUILD_NAME" "$CHANNEL"
      fi

      cd dist/

      echo "Uploading $ZIPFILE to GitHub"

      upload_release_asset "$ZIPFILE" "$CHANNEL-headless-$BUILD_NAME-amazonlinux-2017-03.zip"
    )
  
    RELEASE_BODY="$RELEASE_BODY$BUILD_NAME $VERSION ($CHANNEL channel) for amazonlinux:2017.03\n"
  done << EOL
$CHANNEL_LIST
EOL

done

update_release_body "$RELEASE_ID"

publish_release "$RELEASE_ID"


#
# Publish NPM packages
#

# Add NPM token to .npmrc if not logged in
if [ -n "$NPM_TOKEN" ] && ! npm whoami -s; then
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > "$HOME/.npmrc"
fi

while IFS= read -r PACKAGE; do
  cd "$PROJECT_DIRECTORY/packages/$PACKAGE"
  npm publish
done << EOL
lambda
serverless-plugin
EOL
