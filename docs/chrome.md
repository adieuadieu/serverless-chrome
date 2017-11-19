# Chrome/Chromium on AWS Lambda

## Contents
1. [Prebuilt Binaries](#prebuilt-binaries)
1. [Docker Image](#docker-image)
1. [Build Yourself](#build-yourself)
    1. [Locally](#locally)
    1. [With AWS EC2](#with-aws-ec2)
1. [Fonts](#fonts)
1. [Known Issues / Limitations](#known-issues--limitations)


## Prebuilt Binaries

Prebuilt binaries are regularly released and made available under [Releases](https://github.com/adieuadieu/serverless-chrome/releases). These binaries have been checked to work within the Lambda Execution Environment. New binaries are released whenever there's a new [stable-channel version](https://omahaproxy.appspot.com/) for Linux (about once every 1-2 weeks).

Check this project's released binaries against the latest with:

```bash
./packages/lambda/scripts/latest-versions.sh
```


## Docker Image

The prebuild binaries made available under [Releases](https://github.com/adieuadieu/serverless-chrome/releases) are extracted from the public [adieuadieu/headless-chromium-for-aws-lambda](https://hub.docker.com/r/adieuadieu/headless-chromium-for-aws-lambda/) Docker image. This image is updated daily when there's a new Chromium version on any channel (stable, beta, dev).

The image uses [lambci/lambda](https://hub.docker.com/r/lambci/lambda/) as a base which very closely mimics the live AWS Lambda Environment. We use the [adieuadieu/headless-chromium-for-aws-lambda](https://hub.docker.com/r/adieuadieu/headless-chromium-for-aws-lambda/) image for unit and integration tests.

Run it yourself with:

```bash
docker run -d --rm \
  --name headless-chromium \
  -p 9222:9222 \
  adieuadieu/headless-chromium-for-aws-lambda
```

Headless Chromium is now running and accessible:

```
GET http://localhost:9222/
```

Extract the headless Chrome binary from the container with:

```bash
docker run -dt --rm --name headless-chromium adieuadieu/headless-chromium-for-aws-lambda:stable
docker cp headless-chromium:/bin/headless-chromium ./
docker stop headless-chromium
```


## Build Yourself

### Locally

The easiest way to build headless Chromium locally is with Docker:

```bash
cd packages/lambda/builds/chromium

export CHROMIUM_VERSION=$(./latest.sh stable)

docker build \
  -t "headless-chromium:$CHROMIUM_VERSION" \
  --build-arg VERSION="$CHROMIUM_VERSION" \
  "build"
```

The script `./packages/lambda/builds/chromium/latest.sh stable` returns the latest "stable" channel version of Chromium, e.g. "62.0.3202.94".

The [Dockerfile](/packages/lambda/builds/chromium/build/Dockerfile) in [`packages/lambda/builds/chromium/build`](/packages/lambda/builds/chromium/build) builds the Chromium version specified by `CHROMIUM_VERSION` with the [`build.sh`](/packages/lambda/builds/chromium/build/build.sh) script.

It's also possible to build Chromium without Docker using just the [`build.sh`](/packages/lambda/builds/chromium/build/build.sh) script. However, make sure that you run the script as `root` on a compatible OS environment (e.g. AmazonLinux on EC2):

```bash
cd packages/lambda/builds/chromium

export VERSION=$(./latest.sh stable)

./build/build.sh
```

**Note:** On MacOS building with Docker, if you're running into a no-more-disk-space-available error, you may need to [increase the size](https://community.hortonworks.com/articles/65901/how-to-increase-the-size-of-the-base-docker-for-ma.html) of the Docker data sparse image. *Warning!:* This will wipe out all of your local images/containers:

```bash
rm ~/Library/Containers/com.docker.docker/Data/com.docker.driver.amd64-linux/Docker.qcow2
qemu-img create -f qcow2 ~/Library/Containers/com.docker.docker/Data/com.docker.driver.amd64-linux/Docker.qcow2 50G
```

Install `qemu-img` with `brew install qemu`


### With AWS EC2

How the cool kids build.

Easily build Chromium using an EC2 Spot Instance (spot-block) using the [`ec2-build.sh`](/scripts/ec2-build.sh) script. With a `c5.2xlarge` spot-instance a single build takes rougly 2h15m and usually costs between $0.25 and $0.30 in `us-east-1a`. Or, ~30m on `c5.18xlarge` for about $0.50. To build Chromium, an instance with at least 4GB of memory is required.

Building on EC2 requires some IAM permissions setup:

1. Create a new IAM _user_ with access keys and add [this custom inline policy](/aws/iam-serverless-chrome-automation-user-policy.json). The policy allows the minimum IAM permissions required to initiate a build on an EC2 Spot Instance.
1. Create a new IAM _role_ called "serverless-chrome-automation" with an EC2 trust entity and add [this custom inline policy](/aws/iam-serverless-chrome-automation-role-policy.json). The policy allows the minimum IAM permissions required to retrieve secrets from the Parameter Store, log the instance's stdout/stderr to CloudWatch, and upload binaries to S3. Be sure to update the Resource Arns where appropriate (e.g. for the S3 bucket). Make note of the `Instance Profile ARN` as you'll need to set the `AWS_IAM_INSTANCE_ARN` environment variable to it.

Next, export the following environment variables in your shell:

```bash
export AWS_ACCESS_KEY_ID=<your-iam-user-access-key-created-in-step-1>
export AWS_SECRET_ACCESS_KEY=<your-iam-user-secret-created-in-step-1>
export AWS_IAM_INSTANCE_ARN=<your-iam-role-instance-arn-created-in-step-2>
export S3_BUCKET=<your-s3-bucket-and-optional-prefix>
export FORCE_NEW_BUILD=1
```

Then to start a new build run the following, replacing the version and/or channel if desired:

```bash
./scripts/ec2-build.sh chromium canary 64.0.3272.0
```

The version can also be ommitted. This will build the latest version based on the channel (one of `stable`, `beta`, or `dev`). Canary builds require an explicit version to be defined.

If successfull, the binary will show up in the S3 bucket. Check the CloudWatch `serverless-chrome-automation` log group [logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logStream:group=/serverless-chrome-automation;streamFilter=typeLogStreamPrefix) for errors.

EC2 Spot Instance specifications such as instance type or spot price can be configured via [`/aws/ec2-spot-instance-specification.json`](/aws/ec2-spot-instance-specification.json).

## Fonts

@TODO: document this.


## Known Issues / Limitations

1. Hack to Chrome code to disable `/dev/shm`. Details [here](https://medium.com/@marco.luethy/running-headless-chrome-on-aws-lambda-fa82ad33a9eb).
1. [Hack](https://github.com/adieuadieu/serverless-chrome/issues/41#issuecomment-341712878) to disable Sandbox IPC Polling.
