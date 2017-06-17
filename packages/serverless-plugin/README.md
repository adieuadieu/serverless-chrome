# Serverless-framework Headless Chrome Plugin

A [Serverless-framework](https://github.com/serverless/serverless) plugin which bundles the [@serverless-chrome/lambda](https://github.com/adieuadieu/serverless-chrome/tree/master/packages/lambda) package and ensures that Headless Chrome is running when your function handler is invoked.


## Contents
1. [Installation](#installation)
1. [Setup](#setup)
1. [Examples](#examples)
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


## Examples

Example functions are available [here](). They include:

- Screenshot capturing handler: takes a picture of a URL
- print-to-PDF handler: turns a URL into a PDF


## Local Development

Local development is supported. You must install the `chrome-launcher` package in your project. A locally installed version of Chrome will be launched.


## Configuration

todo:
via custom variables you can pass chrome flags.


### Using with other plugins

Load order is important.

For example, if you're using the [serverless-webpack](https://github.com/elastic-coders/serverless-webpack) plugin, your plugin section should be:

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