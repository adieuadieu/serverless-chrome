# serverless-chrome/lambda

Standalone package to run Headless Chrome on AWS Lambda's Node.js (6.10+) runtime.

[![npm](https://img.shields.io/npm/v/@serverless-chrome/lambda.svg?style=flat-square)](https://www.npmjs.com/package/@serverless-chrome/lambda)


## Contents
1. [Installation](#installation)
1. [Setup](#setup)
1. [Testing](#testing)
1. [Configuration and Deployment](#configuration-and-deployment)
1. [Known Issues / Limitations](#known-issues-limitations)
1. [Roadmap](#roadmap)
1. [Troubleshooting](#troubleshooting)


## Installation
Install with yarn:

```bash
yarn add @serverless-chrome/lambda
```

Install with npm:

```bash
npm install --save @serverless-chrome/lambda
```

If you wish to develop locally, you also need to install `chrome-launcher`:

```bash
npm install --save-dev chrome-launcher
```

## Setup

Use in your AWS Lambda function. Requires Node 6.10.


todo: check that this code works:
```js
const launchChrome = require('@serverless-chrome/lambda')
const CDP = require('chrome-remote-interface')

module.exports.handler = function handler (event, context, callback) {
  launchChrome({
    flags: ['--window-size=1280x1696', '--hide-scrollbars']
  })
  .then((chrome) => {
    // Chrome is now running on localhost:9222

    CDP.Version()
      .then((versionInfo) => {
        callback(null, {
          versionInfo,
        })
      })
      .catch((error) => {
        callback(error)
      })
  })
  .catch((error) => {
    // Chrome didn't launch correctly

    callback(error)
  })
}
```

## Local Development

Local development is supported. In a non-lambda environment, the package will use chrome-launcher to launch a locally installed Chrome. You can also pass your own `chromePath`:

```js
launchChrome({ chromePath: '/my/local/chrome/path' })
```

**Command line flags (or "switches")**

The behavior of Chrome does vary between platforms. It may be necessary to experiment with flags to get the results you desire. On Lambda [default flags](https://github.com/adieuadieu/serverless-chrome/blob/develop/packages/lambda/src/flags.js) are used, but in development no default flags are used.

The package has zero external dependencies required for inclusion in your Lambda function's package.

## Framework Plugins

There are plugins which bundle this package for easy deployment available for the following "serverless" frameworks:

- [serverless-plugin-chrome](https://github.com/adieuadieu/serverless-chrome/tree/master/packages/serverless-plugin)
