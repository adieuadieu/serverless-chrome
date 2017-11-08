#!/bin/sh
# shellcheck shell=dash

#
# Perform a build using a AWS EC2 Spot Instance
#
# Usage: ./ec2-build.sh chromium|firefox stable|beta|dev version|tag
#

set -e

cd "$(dirname "$0")/.."

AWS_REGION=us-east-1

PROJECT_DIRECTORY=$(pwd)
BUILD_NAME=${1:-chromium}
CHANNEL=${2:-dev}
VERSION=${3:-master}

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
# @TODO: adjust instance type/spot-price depending on channel?
aws ec2 request-spot-instances \
  --region "$AWS_REGION" \
  --cli-input-json "$JSON"
