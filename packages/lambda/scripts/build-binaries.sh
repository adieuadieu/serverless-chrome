#!/bin/sh
# shellcheck shell=dash

# Requires jq and Docker

set -e

PACKAGE_DIRECTORY="$(dirname "$0")/.."


build() {
  BUILD_NAME=$1
  DOCKER_IMAGE=serverless-chrome-$BUILD_NAME
  VERSION=$(jq -r .config."$BUILD_NAME"Version package.json)
  BUILD_PATH=build/$BUILD_NAME
  TARBALL_PATH=$BUILD_PATH/../headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.tar.gz
  
  export VERSION
  
  echo "t: $TARBALL_PATH"

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"

  exit

  mkdir -p "$BUILD_PATH"

  # Build
  docker build -t "$DOCKER_IMAGE" .

  # Extract headless_shell from docker image
  docker run -dt --name "$DOCKER_IMAGE" "$DOCKER_IMAGE"
  docker cp "$DOCKER_IMAGE":/chrome/Chromium/src/out/Headless/headless_shell "$BUILD_PATH"
  docker stop "$DOCKER_IMAGE"

  # Package
  tar --no-xattrs --hard-dereference -cznshf "$TARBALL_PATH" "$BUILD_PATH"


  # Cleanup
  rm -Rf "$BUILD_PATH"

  
}


if [ ! -z "$1" ]; then
  build "$1"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}"
  done
fi


exit
