#!/bin/sh
# shellcheck shell=dash

#
# Perform a build using a AWS EC2 Spot Instance
#
# Usage: ./ec2-build.sh chromium|firefox stable|beta|dev version|tag
#
#
# Further documentation: 
# https://github.com/adieuadieu/serverless-chrome/blob/develop/docs/automation.md
# https://github.com/adieuadieu/serverless-chrome/blob/develop/docs/chrome.md
#

set -e

cd "$(dirname "$0")/.."

AWS_REGION=${AWS_REGION:-us-east-1}

PROJECT_DIRECTORY=$(pwd)
BUILD_NAME=${1:-chromium}
CHANNEL=${2:-stable}
VERSION=${3:-master}
DOCKER_ORG=${DOCKER_ORG:-adieuadieu}
S3_BUCKET=${S3_BUCKET:-}
FORCE_NEW_BUILD=${FORCE_NEW_BUILD:-}

#
# Check for some required env variables
# 
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Missing required AWS_ACCESS_KEY_ID and/or AWS_SECRET_ACCESS_KEY environment variables"
  exit 1
fi

if [ -z "$AWS_IAM_INSTANCE_ARN" ]; then
  echo "Missing required AWS_IAM_INSTANCE_ARN environment variables"
  exit 1
fi

echo "Launching EC2 spot instance to build $BUILD_NAME version $VERSION ($CHANNEL channel)"

#
# Pre-process and base64 encode user-data payload (a shell script)
# run on instance startup via cloudinit
#
USER_DATA=$(sed -e "s/INSERT_CHANNEL_HERE/$CHANNEL/g" "$PROJECT_DIRECTORY/aws/user-data.sh" | \
  sed -e "s/INSERT_BROWSER_HERE/$BUILD_NAME/g" | \
  sed -e "s/INSERT_VERSION_HERE/$VERSION/g" | \
  sed -e "s/INSERT_DOCKER_ORG_HERE/$DOCKER_ORG/g" | \
  sed -e "s/INSERT_S3_BUCKET_HERE/$S3_BUCKET/g" | \
  sed -e "s/INSERT_FORCE_NEW_BUILD_HERE/$FORCE_NEW_BUILD/g" | \
  base64 \
)

#
# Setup JSON payload which sets/configures the AWS CLI command
#
JSON=$(jq -c -r \
  ".LaunchSpecification.UserData |= \"$USER_DATA\" | .LaunchSpecification.IamInstanceProfile.Arn |= \"$AWS_IAM_INSTANCE_ARN\"" \
  "$PROJECT_DIRECTORY/aws/ec2-spot-instance-specification.json"
)

#
# Request the spot instance / launch
# ref: http://docs.aws.amazon.com/cli/latest/reference/ec2/request-spot-instances.html
#
aws ec2 request-spot-instances \
  --region "$AWS_REGION" \
  --valid-until "$(date -u -v +4H +%FT%T%.000Z)" \
  --cli-input-json "$JSON" | \
  jq -r ".SpotInstanceRequests[].Status"
