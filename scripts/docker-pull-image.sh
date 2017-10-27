#!/bin/sh
# shellcheck shell=dash

#
# Pull projects' latest Docker images
#
# Requires Docker
#
# Usage: ./docker-pull-image.sh [chromium|firefox] [base]
#

set -e

cd "$(dirname "$0")/.."

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

# better implementation here: https://github.com/blueimp/shell-scripts/blob/master/bin/docker-image-exists.sh
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

  if [ -n "$DO_BASE_BUILD" ]; then
    DOCKER_IMAGE=$BUILD_NAME-for-amazonlinux-base
  fi

  if docker_tag_exists "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
    echo "Pulling $BUILD_NAME version $LATEST_VERSION."
    docker pull "adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION"
  else
    echo "Docker image adieuadieu/$DOCKER_IMAGE:$LATEST_VERSION doesn't exist."
    exit 1
  fi
}

# main script

cd "$PROJECT_DIRECTORY"

if [ ! -z "$1" ]; then
  build "$1" "$2"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}" "$2"
  done
fi
