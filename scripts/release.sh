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

if [ -z "$GITHUB_TOKEN" ]; then
  printf "Error: Missing %s environment variable.\n" \
    GITHUB_TOKEN >&2
  exit 1
fi


ORIGIN_URL=$(git config --get remote.origin.url)
GITHUB_ORG=$(echo "$ORIGIN_URL" | sed 's|.*:||;s|/.*$||')
GITHUB_REPO=$(echo "$ORIGIN_URL" | sed 's|.*/||;s|\.[^\.]*$||')
export GITHUB_ORG
export GITHUB_REPO

echo '--- Fetching tags'
git fetch origin 'refs/tags/*:refs/tags/*'

# Get the tag for the current commit:
TAG="$(git describe --exact-match --tags 2> /dev/null || true)"

if [ -z "$TAG" ]; then
  printf "%s: Not a tagged commit\n" Warning
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

RELEASE_BODY=""

create_draft_release() {
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

echo "Creating draft release $TAG"
create_draft_release

# upload zipped builds
cd packages/lambda/builds

for BUILD in */Dockerfile; do
  BUILD_NAME="${BUILD%%/*}"
  
    cd "$BUILD_NAME" || exit

    VERSION=$(./latest.sh)
    ZIPFILE=headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.zip

    cd build/

    if [ ! -f "$ZIPFILE" ]; then
      echo "$BUILD_NAME version $VERSION has not been built. Building ..."
      ../../../scripts/build-binaries.sh "$BUILD_NAME"
    fi

    echo "Uploading $ZIPFILE to GitHub"

    upload_release_asset "$ZIPFILE" "headless-$BUILD_NAME-amazonlinux-2017-03.zip"
  
    RELEASE_BODY="$RELEASE_BODY$BUILD_NAME $VERSION for amazonlinux:2017.03\n"
done

update_release_body "$RELEASE_ID"



# @TODO
# publish npm packages with new versions
