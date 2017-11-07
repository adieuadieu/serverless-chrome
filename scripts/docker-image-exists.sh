#!/bin/sh
# shellcheck shell=dash

#
# Check if a Docker image and tag exists on Docker Hub
#
# Requires curl
#
# Usage: ./docker-image-exists image [tag]
#

set -e

# better implementation here: https://github.com/blueimp/shell-scripts/blob/master/bin/docker-image-exists.sh
# ref: https://stackoverflow.com/a/39731444/845713

curl --silent -f -L "https://index.docker.io/v1/repositories/$1/tags/$2" > /dev/null
