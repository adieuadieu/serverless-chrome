# serverless-chrome/lambda

Standalone package to run Headless Chrome in AWS Lambda.


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
