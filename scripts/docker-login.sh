#!/bin/sh
# shellcheck shell=dash

#
# Login to Docker Hub checking for credentials before doing so.
#
# Usage: ./docker-login.sh
#

set -e

# Slightly naive and assumes we're not using multiple registries

if [ -f ~/.docker/config.json ] && \
  [ "$(jq -re '.auths | length' ~/.docker/config.json)" -gt 0 ]; then
  echo "Already logged in to Docker Hub"
  exit 0
fi

if [ -z "$DOCKER_USER" ] || [ -z "$DOCKER_PASS" ]; then
  echo "Missing required DOCKER_USER and/or DOCKER_PASS environment variables"
  exit 1
fi  

# Log in to Docker Hub
docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"
