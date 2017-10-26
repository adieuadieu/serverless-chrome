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

PROJECT_DIRECTORY=$(pwd)

PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

cd "$PACKAGE_DIRECTORY"

build() {
  BUILD_NAME=$1
  
  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  DOCKER_IMAGE=$BUILD_NAME-for-amazonlinux-base
  CURRENT_VERSION=$(jq -r ".stable" version.json)
  LATEST_VERSION=$(./latest.sh)

  if [ "$CURRENT_VERSION" != "$LATEST_VERSION" ]; then
    echo "Building Docker image $BUILD_NAME version $LATEST_VERSION"
    
    docker build \
      --squash \
      --compress \
      -t "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" \
      --build-arg VERSION="$LATEST_VERSION" \
      base/
    
    if [ ! -z "$DOCKER_USER" ] && [ ! -z "$DOCKER_PASS" ]; then
      echo "Pushing image to Docker hub"

      docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
      docker push "adieuadieu/chromium-for-amazonlinux-base:$LATEST_VERSION"
    fi  
  else
    echo "$BUILD_NAME version $LATEST_VERSION was previously built. Skipping build."
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
