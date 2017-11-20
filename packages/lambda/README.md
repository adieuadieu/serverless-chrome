# serverless-chrome/lambda

Standalone package to run Headless Chrome on AWS Lambda's Node.js (6.10+) runtime.

[![npm](https://img.shields.io/npm/v/@serverless-chrome/lambda.svg?style=flat-square)](https://www.npmjs.com/package/@serverless-chrome/lambda)


## Contents
1. [Installation](#installation)
1. [Setup](#setup)
1. [Local Development](#local-development)
1. [Framework Plugins](#framework-plugins)
1. [Specifying Chromium Channel](#specifying-chromium-channel)


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
  // Chrome didn't launch correctly 😢
  .catch(callback)
}
```


## Local Development

Local development is supported. In a non-lambda environment, the package will use chrome-launcher to launch a locally installed Chrome. You can also pass your own `chromePath`:

```js
launchChrome({ chromePath: '/my/local/chrome/path' })
```

**Command line flags (or "switches")**

The behavior of Chrome does vary between platforms. It may be necessary to experiment with flags to get the results you desire. On Lambda [default flags](/packages/lambda/src/flags.js) are used, but in development no default flags are used.

The package has zero external dependencies required for inclusion in your Lambda function's package.


## Framework Plugins

There are plugins which bundle this package for easy deployment available for the following "serverless" frameworks:

- [serverless-plugin-chrome](/packages/serverless-plugin)


## Specifying Chromium Channel

This package will use the latest stable-channel build of Headless Chromium for AWS Lambda. To select a different channel (beta or dev), export either an environment variable `NPM_CONFIG_CHROMIUM_CHANNEL` or add `chromiumChannel` to the `config` section of your `package.json`:

Your `package.json`:

```json
{
  "name": "my-cool-project",
  "version": "1.0.0",
  "config": {
    "chromiumChannel": "dev"  <-- here
  },
  "scripts": {

  },
  "description": {

  }
}
```

Note: the `dev` channel is _almost_ `canary`, so use `dev` if you're looking for the Canary channel.

You can skip download entirely with `NPM_CONFIG_SERVERLESS_CHROME_SKIP_DOWNLOAD` or setting `skip_download` in the `config` section of your `package.json`

_Caution_: We test and develop features against the stable channel. Using the beta or dev channel versions of Chromium may lead to unexpected results, especially in relation to the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/) (which is used by tools like Chromeless and Puppeteer).
