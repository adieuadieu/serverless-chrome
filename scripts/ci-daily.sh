#!/bin/sh
# shellcheck shell=dash

#
# Builds docker images
#
# Usage: ./ci-daily.sh stable|beta|dev [chromium|firefox]
#

set -e

cd "$(dirname "$0")/.."

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

CHANNEL=${1:-stable}

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Missing required AWS_ACCESS_KEY_ID and/or AWS_SECRET_ACCESS_KEY environment variables"
  exit 1
fi

if [ -z "$AWS_IAM_INSTANCE_ARN" ]; then
  echo "Missing required AWS_IAM_INSTANCE_ARN environment variables"
  exit 1
fi

launch_if_new() {
  BUILD_NAME=$1

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"

  LATEST_VERSION=$(./latest.sh "$CHANNEL")
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda

  if "$PROJECT_DIRECTORY/scripts/docker-image-exists.sh" "adieuadieu/$DOCKER_IMAGE" "$LATEST_VERSION"; then
    echo "$BUILD_NAME version $LATEST_VERSION was previously built. Skipping build."
  else
    "$PROJECT_DIRECTORY/scripts/ec2-build.sh" "$BUILD_NAME" "$CHANNEL" "$LATEST_VERSION"
  fi
}

# main script

cd "$PROJECT_DIRECTORY"

if [ ! -z "$2" ]; then
  launch_if_new "$2"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    launch_if_new "${DOCKER_FILE%%/*}"
  done
fi
