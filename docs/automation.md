# Automation

These docs are a work-in-progress (read: incomplete).

Automation of builds.

There is more documentation concerning building Chrome/Chromium [here](/docs/chrome.md)


## Setup

- create IAM role "serverless-chrome-automation" with policy defined in `aws/iam-serverless-chrome-automation-role.json`
- if desired, modify `aws/ec2-spot-instance-specification.json` to change instance-types and max spot-price 
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_IAM_INSTANCE_ARN


## Manual Build

To perform a manual build on EC2 using a spot instance:

```sh
./scripts/ec2-build.sh chromium stable 62.0.3202.75
```


## CI Build

See `.circleci/config.yml` "daily" workflow for example.

Example: Build latest Chromium (stable channel):

```sh
./scripts/ci-daily.sh stable chromium
```
