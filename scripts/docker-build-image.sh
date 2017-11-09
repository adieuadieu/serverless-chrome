#!/bin/sh
# shellcheck shell=dash

#
# Builds docker images
#
# Requires Docker, jq, and curl
#
# Usage: ./docker-build-image.sh stable|beta|dev [chromium|firefox]
#

set -e

cd "$(dirname "$0")/.."

DO_PUSH=1

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

if [ -z "$1" ]; then
  echo "Missing required channel argument"
  exit 1
fi

CHANNEL=${1:-stable}
shift

build() {
  BUILD_NAME=$1

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
  
  LATEST_VERSION=$(./latest.sh "$CHANNEL")
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda

  
  if "$PROJECT_DIRECTORY/scripts/docker-image-exists.sh" "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
    echo "$BUILD_NAME version $LATEST_VERSION was previously built. Skipping build."
  else
    echo "Building Docker image $BUILD_NAME version $LATEST_VERSION"

    # Build in Docker
    docker build \
      --compress \
      -t "adieuadieu/$DOCKER_IMAGE-build:$LATEST_VERSION" \
      --build-arg VERSION="$LATEST_VERSION" \
      "build"

    mkdir -p dist/

    # Extract the binary produced in the build
    docker run -dt --rm --name "$DOCKER_IMAGE-build" "adieuadieu/$DOCKER_IMAGE-build:$LATEST_VERSION"
    docker cp "$DOCKER_IMAGE-build:/bin/headless-$BUILD_NAME" dist/
    docker stop "$DOCKER_IMAGE-build"

    # Create the public Docker image
    # We do this because the image in which be build ends up being huge
    # due to the source code and build dependencies
    docker build \
      --compress \
      -t "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" \
      --build-arg VERSION="$LATEST_VERSION" \
      "."

    if [ -n "$DO_PUSH" ]; then
      echo "Pushing image to Docker hub"

      # Only tag stable channel as latest
      if [ "$CHANNEL" = "stable" ]; then
        docker tag "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" "adieuadieu/$DOCKER_IMAGE:latest"
      fi

      docker tag "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION" "adieuadieu/$DOCKER_IMAGE:$CHANNEL"

      docker push "adieuadieu/$DOCKER_IMAGE"
    fi
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
