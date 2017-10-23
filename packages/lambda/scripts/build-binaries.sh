#!/bin/sh
# shellcheck shell=dash

#
# Builds specified or all headless browsers (chromium, firefox) version defined in package.json
#
# Requires Docker, jq, and zip
#
# Usage: ./build-binaries.sh [chromium|firefox]
#

set -e

cd "$(dirname "$0")/.."

PACKAGE_DIRECTORY=$(pwd)

build() {
  BUILD_NAME=$1
  
  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  DOCKER_IMAGE=serverless-chrome-$BUILD_NAME
  VERSION=$(jq -r ".stable" version.json)
  BUILD_PATH="build/$BUILD_NAME"
  ZIPFILE_PATH="headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.zip"

  if [ ! -f "build/$ZIPFILE_PATH" ]; then
    export VERSION

    echo "Building $BUILD_NAME version $VERSION"
    
    mkdir -p "$BUILD_PATH"

    # Build
    docker build -t "$DOCKER_IMAGE" --build-arg VERSION="$VERSION" .

    # Extract binary from docker image
    docker run -dt --rm --name "$DOCKER_IMAGE" "$DOCKER_IMAGE"
    docker cp "$DOCKER_IMAGE":/build/headless-"$BUILD_NAME" "$BUILD_PATH"
    docker stop "$DOCKER_IMAGE"

    # Package
    cd "$BUILD_PATH"
    zip -9 -D "../$ZIPFILE_PATH" "headless-$BUILD_NAME"
    cd ../../

    # stick a copy in packages' dist/ for tests and local dev
    mkdir -p "$PACKAGE_DIRECTORY/dist"
    cp "$BUILD_PATH/headless-$BUILD_NAME" "$PACKAGE_DIRECTORY/dist"

    # Cleanup
    rm -Rf "$BUILD_PATH"    
  else
    echo "$BUILD_NAME version $VERSION was previously built. Skipping build."
  fi
}

# main script

if [ ! -z "$1" ]; then
  build "$1"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}"
  done
fi
