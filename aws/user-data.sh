#!/bin/bash
# shellcheck shell=dash

#
# Usage: Run as a start-up script on an EC2 instance via user-data cloud-init
#

set -e

# These get replaced with values in ~/scripts/daily.sh
CHANNEL=INSERT_CHANNEL_HERE
BROWSER=INSERT_BROWSER_HERE

if [ -n "$CHANNEL" ] && [ -n "$BROWSER" ]; then
  yum update -y

  yum install -y docker jq git

  service docker start

  EC2_INSTANCE_ID=$(curl -s http://instance-data/latest/meta-data/instance-id)

  AWS_REGION=$(curl -s http://instance-data/latest/dynamic/instance-identity/document | \
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
    --name /serverless-chrome-automation/DOCKER_PASS | \
    jq -r ".Parameter.Value" \
  )

  export AWS_REGION
  export DOCKER_USER
  export DOCKER_PASS

  git clone "https://github.com/adieuadieu/serverless-chrome.git"

  cd serverless-chrome

  # TODO: temporary.
  git checkout develop

  scripts/docker-build-image.sh "$CHANNEL" "$BROWSER"
fi

# Shutdown (terminate) the instance
aws ec2 terminate-instances \
  --region "$AWS_REGION" \
  --instance-ids "$EC2_INSTANCE_ID"
