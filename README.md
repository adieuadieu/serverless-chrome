# serverless-chrome

**What:** Serverless Chrome contains everything you need to get started running headless Chrome on AWS Lambda (possibly Azure and GCP Functions soon).

**Why:** Because it's neat. And the PhantomJS guy never updates WebKit so you can't do anything Modern.


[![CircleCI](https://img.shields.io/circleci/project/github/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://circleci.com/gh/adieuadieu/serverless-chrome)
[![Coveralls](https://img.shields.io/coveralls/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://coveralls.io/github/adieuadieu/serverless-chrome)
[![Codacy grade](https://img.shields.io/codacy/grade/cd743cc370104d49a508cc4b7689c1aa.svg?style=flat-square)](https://www.codacy.com/app/adieuadieu/serverless-chrome)
[![David](https://img.shields.io/david/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/adieuadieu/serverless-chrome.svg?style=flat-square)]()


## Contents
1. [What is it?](#what-is-it)
1. [Installation](#installation)
1. [Setup](#setup)
1. [Testing](#testing)
1. [Deployment](#deployment)
1. [Configuration](#configuration)
1. [Known Issues / Limitations](#known-issues-limitations)
1. [Troubleshooting](#troubleshooting)


## Installation
Installation can be achieved with the following commands

```bash
git clone https://github.com/adieuadieu/serverless-chrome
cd serverless-chrome
yarn install
```

(It is possible to exchange `yarn` for `npm` if `yarn` is too hipster for you. No problem.)

Or, if you have `serverless` installed globally:

```bash
serverless install -u https://github.com/adieuadieu/serverless-chrome
```

## Setup

### Credentials

You must configure your AWS credentials either by defining `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environmental variables, or using an AWS profile. You can read more about this on the [Serverless Credentials Guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/). It's a bit of a pain in the ass if you have many projects/credentials.

In short, either:

```bash
export AWS_PROFILE=<your-profile-name>
```

or

```bash
export AWS_ACCESS_KEY_ID=<your-key-here>
export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
```


## Testing

Test with `yarn test` or just `yarn ava` to skip the linter.


## Deployment

```bash
yarn deploy
```

This package bundles a lambda-execution-environment-ready headless Chrome binary which allows you to deploy from any OS.


## Configuration

TODO: talk about CDP and [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)

### Example Handlers

- Capture Screenshot of a given URL


## Known Issues / Limitations
1. ws@2/Buffer.from **TODO:** create, then add link to issue here
1. hack to chrome code to disable /dev/shm.
1. /tmp size on Lambda


## Troubleshooting

<details id="ts-aws-client-timeout">
  <summary>I keep getting a timeout error when deploying and it's really annoying.</summary>
  Indeed, that is annoying. I've had the same problem, and so that's why it's now here in this troubleshooting section. This may be an issue in the underlying AWS SDK when using a slower Internet connection. Try changing the `AWS_CLIENT_TIMEOUT` environment variable to a higher value. For example, in your command prompt enter the following and try deploying again:

```bash
export AWS_CLIENT_TIMEOUT=3000000
```
</details>

<details id="ts-argh">
  <summary>Aaaaaarggghhhhhh!!!</summary>
  Uuurrrggghhhhhh! Have you tried [filing an Issue](https://github.com/adieuadieu/serverless-chrome/issues/new)?
</details>


## TODO
1. example handler with [nightmarejs](https://github.com/segmentio/nightmare) (if this is even possible?)



You might also be interested in:
- [PhantomJS](http://phantomjs.org/)
- [wkhtmltopdf](https://github.com/wkhtmltopdf/wkhtmltopdf)
- [node-webkitgtk](https://github.com/kapouer/node-webkitgtk)
- [electron-pdf](https://github.com/Janpot/electron-pdf)
