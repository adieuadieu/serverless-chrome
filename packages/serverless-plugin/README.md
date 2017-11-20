# Serverless-framework Headless Chrome Plugin

A [Serverless-framework](https://github.com/serverless/serverless) plugin which bundles the [@serverless-chrome/lambda](/packages/lambda) package and ensures that Headless Chrome is running when your function handler is invoked.

[![npm](https://img.shields.io/npm/v/serverless-plugin-chrome.svg?style=flat-square)](https://www.npmjs.com/package/serverless-plugin-chrome)

## Contents
1. [Installation](#installation)
1. [Setup](#setup)
1. [Examples](#examples)
1. [Local Development](#local-development)
1. [Configuration](#configuration)


## Installation

Install with yarn:

```bash
yarn add --dev serverless-plugin-chrome
```

Install with npm:

```bash
npm install --save-dev serverless-plugin-chrome
```

Requires Node 6.10 runtime.


## Setup

Add the following plugin to your `serverless.yml`:

```yaml
plugins:
  - serverless-plugin-chrome
```

Then, in your handler code.. Do whatever you want. Chrome will be running!

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

Further details are available in the [Serverless Lambda example](/examples/serverless-framework/aws).


## Examples

Example functions are available [here](/examples/serverless-framework). They include:

- Screenshot capturing handler: takes a picture of a URL
- print-to-PDF handler: turns a URL into a PDF


## Local Development

Local development is supported. You must install the `chrome-launcher` package in your project. A locally installed version of Chrome will be launched.

**Command line flags (or "switches")**

The behavior of Chrome does vary between platforms. It may be necessary to experiment with flags to get the results you desire. On Lambda [default flags](/packages/lambda/src/flags.js) are used, but in development no default flags are used.

## Configuration

You can pass custom flags with which to launch Chrome using the `custom` section in `serverless.yml`. For example:

```yaml
plugins:
  - serverless-plugin-chrome

custom:
  chrome:
    flags:
      - --window-size=1280x1696 # Letter size
      - --hide-scrollbars
      - --ignore-certificate-errors
    functions:
      - enableChromeOnThisFunctionName
      - mySuperChromeFunction
```

It is also possible to enable Chrome on only specific functions in your service using the `custom.chrome.functions` configuration. For example:

```yaml
custom:
  chrome:
    functions:
      - enableChromeOnThisFunctionName
      - mySuperChromeFunction
```

You can enable debugging/logging output by specifying the DEBUG env variable in the provider section of `serverless.yml`. For example:

```yaml
provider:
  name: aws
  runtime: nodejs6.10
  environment:
    DEBUG: "*"

plugins:
  - serverless-plugin-chrome
```


### Using with other plugins

Load order is important.

For example, if you're using the [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) plugin, your plugin section should be:

```yaml
plugins:
  - serverless-plugin-chrome # 1st
  - serverless-webpack
```

However, with the [serverless-plugin-typescript](https://github.com/graphcool/serverless-plugin-typescript) plugin, the order is:

```yaml
plugins:
  - serverless-plugin-typescript
  - serverless-plugin-chrome # 2nd
```


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
