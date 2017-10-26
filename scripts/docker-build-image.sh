#!/bin/sh
# shellcheck shell=dash

#
# Builds docker images
#
# Requires Docker, jq, and curl
#
# Usage: ./docker-build-image.sh [chromium|firefox] [base]
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
  DO_BASE_BUILD=$2
  
  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  LATEST_VERSION=$(./latest.sh)
  
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda
  BUILD_CONTEXT="."

  if [ -n "$DO_BASE_BUILD" ]; then
    DOCKER_IMAGE=$BUILD_NAME-for-amazonlinux-base
    BUILD_CONTEXT="base/"
  fi

  if docker_tag_exists "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
    echo "$BUILD_NAME version $LATEST_VERSION was previously built. Skipping build."
    docker pull "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION"
  else
    echo "Building Docker image $BUILD_NAME version $LATEST_VERSION"
    docker build \
      --squash \
      --compress \
      -t "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" \
      --build-arg VERSION="$LATEST_VERSION" \
      "$BUILD_CONTEXT"

      echo "Pushing image to Docker hub"
      docker push "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION"
  fi
}

# main script

cd "$PROJECT_DIRECTORY"

# Docker Login
scripts/docker-login.sh

if [ ! -z "$1" ]; then
  build "$1" "$2"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}" "$2"
  done
fi
