#!/bin/sh
# shellcheck shell=dash

#
# Builds specified or all headless browsers (chromium, firefox) version defined in package.json
#
# Requires Docker, jq, and zip
#
# Usage: ./build-binaries.sh [chromium|firefox] [stable|beta|dev]
#

set -e

cd "$(dirname "$0")/.."

PACKAGE_DIRECTORY=$(pwd)

packageBinary() {
  BUILD_NAME=$1
  CHANNEL=$2

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda
  VERSION=$(jq -r ".$CHANNEL" version.json)
  BUILD_PATH="dist/$BUILD_NAME"
  ZIPFILE_PATH="$CHANNEL-headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.zip"

  if [ ! -f "dist/$ZIPFILE_PATH" ]; then
    echo "Packaging $BUILD_NAME version $VERSION ($CHANNEL)"
    
    mkdir -p "$BUILD_PATH"

    # Extract binary from docker image
    docker run -dt --rm --name "$DOCKER_IMAGE" "adieuadieu/$DOCKER_IMAGE:$VERSION"
    docker cp "$DOCKER_IMAGE":/bin/headless-"$BUILD_NAME" "$BUILD_PATH"
    docker stop "$DOCKER_IMAGE"

    # Package
    cd "$BUILD_PATH"
    zip -9 -D "../$ZIPFILE_PATH" "headless-$BUILD_NAME"
    cd ../../

    # stick a copy in packages' dist/ for tests and local dev
    mkdir -p "$PACKAGE_DIRECTORY/dist"
    cp "$BUILD_PATH/headless-$BUILD_NAME" "$PACKAGE_DIRECTORY/dist/$CHANNEL-headless-$BUILD_NAME"

    # Cleanup
    rm -Rf "$BUILD_PATH"
  else
    echo "$BUILD_NAME version $VERSION was previously package. Skipping."
  fi
}

# main script

if [ ! -z "$1" ]; then
  packageBinary "$1" "$2"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    packageBinary "${DOCKER_FILE%%/*}" stable
    packageBinary "${DOCKER_FILE%%/*}" beta
    packageBinary "${DOCKER_FILE%%/*}" dev
  done
fi
