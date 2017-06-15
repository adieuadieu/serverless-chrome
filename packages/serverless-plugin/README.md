# Serverless-framework Headless Chrome Plugin

A [Serverless-framework](https://github.com/serverless/serverless) plugin which bundles the @serverless-chrome/lambda package and ensures that Headless Chrome is running when your function handler is invoked.

## Contents
1. [Installation](#installation)
1. [Setup](#setup)
1. [Local Development](#local-development)
1. [Configuration](#configuration)

## Installation

Install with yarn:

```bash
yarn add --dev serverless-plugin-headless-chrome
```

Install with npm:

```bash
npm install --save-dev serverless-plugin-headless-chrome
```

Requires Node 6.10 runtime.


## Setup


Add the following plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-plugin-headless-chrome
```

Then, in your handler code.. Do whatever you want. Chrome is running!

```js
const CDP = require('chrome-remote-interface')

module.exports.hello = (event, context, callback, chrome) => {
  // Chrome is already running!

  CDP.Version()
    .then((versionInfo) => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          versionInfo,
          chrome,
        }),
      })
    })
    .catch((error) => {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          error,
        }),
      })
    })
}
```


## Configuration

todo:
via custom variables you can pass chrome flags.


## Local Development

Local development is supported. A locally installed version of Chrome will be launched.
