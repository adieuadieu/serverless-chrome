#!/bin/bash
# shellcheck shell=dash

#
# Usage: Run as a start-up script on an EC2 instance via user-data cloud-init
# ref: http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html
#

# These get replaced with values in ~/scripts/daily.sh
CHANNEL=INSERT_CHANNEL_HERE
BROWSER=INSERT_BROWSER_HERE

# 
# Setup CloudWatch logging
# ref: http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/QuickStartEC2Instance.html
#
yum install -y awslogs

# config ref: http://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AgentReference.html
printf "
[cloudinit]
log_group_name = /serverless-chrome-automation
log_stream_name = {instance_id}-cloudinit-%s-%s
file = /var/log/cloud-init-output.log
  " \
  "$BROWSER" "$CHANNEL" >> /etc/awslogs/awslogs.conf

service awslogs start

# 
# Go time (if brower and release channel are set.)
#
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

  cd serverless-chrome || return

  # TODO: temporary.
  git checkout develop

  scripts/docker-build-image.sh "$CHANNEL" "$BROWSER"
fi

# 
# Shutdown (terminate) the instance
#
# @TODO: IAM perissions for this..
# aws ec2 terminate-instances \
#   --region "$AWS_REGION" \
#   --instance-ids "$EC2_INSTANCE_ID"

echo "User-data script completed. Shutting down instance.."

shutdown -h now
