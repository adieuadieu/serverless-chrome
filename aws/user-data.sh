#!/bin/bash
# shellcheck shell=dash

#
# Usage: Run as a start-up script on an EC2 instance via user-data cloud-init
#

set -e

CHANNEL="stable"
BROWSER="chromium"

yum update -y

yum install -y docker jq

AWS_REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | \
  jq -r ".region" \
)

DOCKER_USER=$(aws ssm get-parameter \
  --region "$AWS_REGION" \
  --with-decryption \
  --name /serverless-chrome-automation/DOCKER_USER | \
  jq -r ".Parameter.Value" \
)

DOCKER_PASS=$(aws ssm get-parameter \
  --region "$AWS_REGION" \
  --with-decryption \
  --name /serverless-chrome-automation/DOCKER_USER | \
  jq -r ".Parameter.Value" \
)

export AWS_REGION
export DOCKER_USER
export DOCKER_PASS

git clone "https://github.com/adieuadieu/serverless-chrome.git"

cd ./serverless-chrome || exit 1

# TODO: temporary.
git checkout develop

./scripts/docker-build-images "$BROWSER" "$CHANNEL"
