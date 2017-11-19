#!/bin/sh
# shellcheck shell=dash

#
# Builds docker images
#
# Requires Docker, jq, and curl
#
# Usage: ./docker-build-image.sh stable|beta|dev [chromium|firefox] [version|git-tag]
#

set -e

cd "$(dirname "$0")/.."

CHANNEL=${1:-stable}
BROWSER=${2:-}
VERSION=${3:-}

DOCKER_ORG=${DOCKER_ORG:-adieuadieu}

PROJECT_DIRECTORY=$(pwd)
PACKAGE_DIRECTORY="$PROJECT_DIRECTORY/packages/lambda"

if [ -z "$1" ]; then
  echo "Missing required channel argument"
  exit 1
fi

build() {
  BUILD_NAME=$1
  DOCKER_IMAGE=headless-$BUILD_NAME-for-aws-lambda

  if [ -z "$VERSION" ]; then
    VERSION=$(./latest.sh "$CHANNEL")
  fi

  cd "$PACKAGE_DIRECTORY/builds/$BUILD_NAME"
    
  if "$PROJECT_DIRECTORY/scripts/docker-image-exists.sh" \
      "$DOCKER_ORG/$DOCKER_IMAGE" "$VERSION" \
    && [ -z "$FORCE_NEW_BUILD" ]; then
    echo "$BUILD_NAME version $VERSION was previously built. Skipping build."
  else
    echo "Building Docker image $BUILD_NAME version $VERSION"

    # Build in Docker
    docker build \
      --compress \
      -t "$DOCKER_ORG/$DOCKER_IMAGE-build:$VERSION" \
      --build-arg VERSION="$VERSION" \
      "build"

    mkdir -p dist/

    # Run the container
    docker run -dt --rm \
      --name "$DOCKER_IMAGE-build" \
      -p 9222:9222 \
      "$DOCKER_ORG/$DOCKER_IMAGE-build:$VERSION"

    # Give the container and browser some time to start up
    sleep 10

    # Test the build and return if it doesn't run
    if ! curl -fs http://localhost:9222/json/version; then
      echo "Unable to correctly run and connect to build via Docker."

      # @TODO: this is specific to chromium......
      echo "Here's some output:"

      docker logs "$DOCKER_IMAGE-build"

      docker run --init --rm \
        --entrypoint="/bin/headless-chromium" \
        "$DOCKER_ORG/$DOCKER_IMAGE-build:$VERSION" \
        --no-sandbox --disable-gpu http://google.com/
      return
    fi

    # Extract the binary produced in the build
    docker cp "$DOCKER_IMAGE-build:/bin/headless-$BUILD_NAME" dist/
    docker stop "$DOCKER_IMAGE-build"

    # Create the public Docker image
    # We do this because the image in which be build ends up being huge
    # due to the source code and build dependencies
    docker build \
      --compress \
      -t "$DOCKER_ORG/$DOCKER_IMAGE:$VERSION" \
      --build-arg VERSION="$VERSION" \
      "."

    if [ -n "$DO_PUSH" ]; then
      echo "Pushing image to Docker hub"

      # Only tag stable channel as latest
      if [ "$CHANNEL" = "stable" ]; then
        docker tag \
          "$DOCKER_ORG/$DOCKER_IMAGE:$VERSION" \
          "$DOCKER_ORG/$DOCKER_IMAGE:latest"
      fi

      docker tag \
        "$DOCKER_ORG/$DOCKER_IMAGE:$VERSION" \
        "$DOCKER_ORG/$DOCKER_IMAGE:$CHANNEL"

      docker push "$DOCKER_ORG/$DOCKER_IMAGE"
    fi

    #
    # Upload a zipped binary to S3 if S3_BUCKET is set
    # Prints a presigned S3 URL to the zip file
    #
    if [ -n "$S3_BUCKET" ]; then
      ZIPFILE="headless-$BUILD_NAME-$VERSION-amazonlinux-2017-03.zip"
      S3_OBJECT_URI="s3://$S3_BUCKET/$BUILD_NAME/$CHANNEL/$ZIPFILE"

      (
        cd dist
        zip -9 -D "$ZIPFILE" "headless-$BUILD_NAME"
      )

      aws s3 \
        cp "dist/$ZIPFILE" \
        "$S3_OBJECT_URI" \
        --region "$AWS_REGION"

      S3_PRESIGNED_URL=$(aws s3 presign \
        "$S3_OBJECT_URI" \
        --region "$AWS_REGION" \
        --expires-in 86400 \
      )

      printf "\n\nBinary archive URL: %s\n\n" "$S3_PRESIGNED_URL"
    fi
  fi
}

# main script

cd "$PROJECT_DIRECTORY"

# Docker Login & enable docker push on successful login
if scripts/docker-login.sh; then
  DO_PUSH=1
fi

if [ ! -z "$BROWSER" ]; then
  build "$BROWSER"
else
  cd "$PACKAGE_DIRECTORY/builds"

  for DOCKER_FILE in */Dockerfile; do
    build "${DOCKER_FILE%%/*}"
  done
fi
