#!/bin/sh
# shellcheck shell=dash

#
# Login to Docker Hub checking for credentials before doing so.
#
# Usage: ./docker-login.sh
#

set -e

if [ -z "$DOCKER_USER" ] || [ -z "$DOCKER_PASS" ]; then
  echo "Missing required DOCKER_USER and/or DOCKER_PASS environment variables"
  exit 1
fi  

# Log in to Docker Hub
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
