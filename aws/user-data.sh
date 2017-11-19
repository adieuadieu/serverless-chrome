#!/bin/bash
# shellcheck shell=dash

#
# Usage: Run as a start-up script on an EC2 instance via user-data cloud-init
# ref: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
#

# These get replaced with real values in ~/scripts/ec2-build.sh
BROWSER=INSERT_BROWSER_HERE
CHANNEL=INSERT_CHANNEL_HERE
VERSION=INSERT_VERSION_HERE
DOCKER_ORG=INSERT_DOCKER_ORG_HERE
S3_BUCKET=INSERT_S3_BUCKET_HERE
FORCE_NEW_BUILD=INSERT_FORCE_NEW_BUILD_HERE

echo "Starting user-data script. $BROWSER $VERSION ($CHANNEL channel)"

# 
# Setup CloudWatch logging
# ref: http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/QuickStartEC2Instance.html
#
yum install -y --quiet awslogs

# config ref: http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AgentReference.html
printf "
[cloudinit]
log_group_name = /serverless-chrome-automation
log_stream_name = {instance_id}-cloudinit-%s-%s-%s
file = /var/log/cloud-init-output.log
  " \
  "$BROWSER" "$VERSION" "$CHANNEL" >> /etc/awslogs/awslogs.conf

service awslogs start

# 
# Go time (if brower and release channel are set.)
#
if [ -n "$CHANNEL" ] && [ -n "$BROWSER" ]; then
  yum update -y --quiet

  yum install -y --quiet docker jq git

  service docker start

  # EC2_INSTANCE_ID=$(curl -s http://instance-data/latest/meta-data/instance-id)

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
  export DOCKER_ORG
  export S3_BUCKET
  export FORCE_NEW_BUILD
  
  git clone "https://github.com/adieuadieu/serverless-chrome.git"

  cd serverless-chrome || return

  # git checkout develop # in case you want to build develop branch

  ./scripts/docker-build-image.sh "$CHANNEL" "$BROWSER" "$VERSION"
fi

# 
# Shutdown (terminate) the instance
#

echo "User-data script completed. Shutting down instance.."

uptime

# Don't shut down immediately so that CloudWatch Agent has time to push logs to AWS
shutdown -h -t 10 +1
