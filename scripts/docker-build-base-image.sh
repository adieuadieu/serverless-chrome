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

# ref: https://stackoverflow.com/a/39731444/845713
docker_tag_exists() {
  curl --silent -f -L "https://index.docker.io/v1/repositories/$1/tags/$2" > /dev/null
}

build() {
  BUILD_NAME=$1
  
  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  DOCKER_IMAGE=$BUILD_NAME-for-amazonlinux-base
  LATEST_VERSION=$(./latest.sh)

  if docker_tag_exists "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
    echo "$BUILD_NAME version $LATEST_VERSION was previously built. Skipping build."
    docker pull "adieuadieu/chromium-for-amazonlinux-base:$LATEST_VERSION"
  else
    echo "Building Docker image $BUILD_NAME version $LATEST_VERSION"
    
    docker build \
      --squash \
      --compress \
      -t "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" \
      --build-arg VERSION="$LATEST_VERSION" \
      base/

      echo "Pushing image to Docker hub"
      docker push "adieuadieu/chromium-for-amazonlinux-base:$LATEST_VERSION"
  fi
}

# main script

cd "$PROJECT_DIRECTORY"

# Docker Login
scripts/docker-login.sh

if [ ! -z "$1" ]; then
  build "$1"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}"
  done
fi
