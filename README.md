# serverless-chrome

Serverless Chrome contains everything you need to get started running headless Chrome on AWS Lambda (possibly Azure and GCP Functions soon).

The aim of this project is to provide the scaffolding for using Headless Chrome during a serverless function invocation. Serverless Chrome takes care of building and bundling the Chrome binaries and making sure Chrome is running when your serverless function executes. In addition, this project also provides a few "example" handlers for common patterns (e.g. taking a screenshot of a page, printing to PDF, some scraping, etc.)

Why? Because it's neat. It also opens up interesting possibilities for using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/) in serverless architectures.

**Breaking Changes coming up!**: Active development is happening in the [develop](https://github.com/adieuadieu/serverless-chrome/tree/develop) branch. v1.0 introduces a framework-agnostic package for running Chrome on AWS Lambda. Try the pre-release with `yarn add @serverless-chrome/lambda`. More info is available [here](https://github.com/adieuadieu/serverless-chrome/tree/develop/packages/lambda). There's also a Serverless-framework plugin [here](https://github.com/adieuadieu/serverless-chrome/tree/develop/packages/serverless-plugin).

Please be sure to raise PRs against the _develop_ branch.


## Contents
1. [What is it?](#what-is-it)
1. [Installation](#installation)
1. [Setup](#setup)
1. [Testing](#testing)
1. [Configuration and Deployment](#configuration-and-deployment)
1. [Known Issues / Limitations](#known-issues--limitations)
1. [Roadmap](#roadmap)
1. [Troubleshooting](#troubleshooting)
1. [Projects & Companies using serverless-chrome](#projects--companies-using-serverless-chrome)
1. [Change log](#change-log)
1. [Prior Art](#prior-art)


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

You must configure your AWS credentials either by defining `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environmental variables, or using an AWS profile. You can read more about this on the [Serverless Credentials Guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

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


## Setup and Deployment

```bash
yarn deploy
```

This package bundles a lambda-execution-environment-ready headless Chrome binary which allows you to deploy from any OS. The current build is:

- **Browser**: HeadlessChrome/60.0.3095.0
- **Protocol-Version**: 1.2
- **User-Agent**: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/60.0.3095.0 Safari/537.36
- **V8-Version**: 6.0.184
- **WebKit-Version**: 537.36 (@947514553066c623a85712d05c3a01bd1bcbbffc)


## Configuration

You can override default configuration in the `/config.js` file generated at the root of the project after a `yarn install`. See the defaults in `src/config.js` for a full list of configuration options.

### Example Handlers

Currently there are only two, very basic "proof of concept" type functions:

###### captureScreenshot: Capture Screenshot of a given URL
 When you the serverless function, it creates a Lambda function which will take a screenshot of a URL it's provided. You can provide this URL to the Lambda function via the AWS API Gateway. After a successful deploy, an API endpoint will be provided. Use this URL to call the Lambda function with a url in the query string. E.g. `https://XXXXXXX.execute-api.us-west-2.amazonaws.com/dev/chrome?url=https://google.com/`

We're using API Gateway as our method to execute the function, but of course it's possible to use any other available triggers to kick things off be it an event from S3, SNS, DynamoDB, etc.
**TODO**: explain how --^

`/config.js`
```js
import captureScreenshot from './src/handlers/captureScreenshot'

export default {
  handler: captureScreenshot
}
```

###### printToPdf: Print a given URL to PDF
The printToPdf handler will create a PDF from a URL it's provided. You can provide this URL to the Lambda function via the AWS API Gateway. After a successful deploy, an API endpoint will be provided. Use this URL to call the Lambda function with a url in the query string. E.g. `https://XXXXXXX.execute-api.us-west-2.amazonaws.com/dev/chrome?url=https://google.com/`

We're using API Gateway as our method to execute the function, but of course it's possible to use any other available triggers to kick things off be it an event from S3, SNS, DynamoDB, etc.
**TODO**: explain how --^

This handler also supports configuring the "paper" size, orientation, etc. You can pass any of the DevTools Protocol's Page.printToPdf() method's parameters. For example, for landscape oriented PDF add `&landscape=true` to the end of the URL. Be sure to remember to escape the value of `url` if it contains query parameters. E.g. `https://XXXXXXX.execute-api.us-west-2.amazonaws.com/dev/chrome?url=https://google.com/&landscape=true`

`/config.js`
```js
import printToPdf from './src/handlers/printToPdf'

export default {
  handler: printToPdf
}
```

### Custom Handlers

You can provide your own handler via the `/config.js` file created when you initialize the project with `yarn install`. The config accepts a `handler` property. Pass it a function which returns a Promise when complete. For example:

`/config.js`
```js
export default {
  handler: async function(invocationEventData, executionContext) {
    const { queryStringParameters: { url } } = invocationEventData
    const stuff = await doSomethingWith(url)
    return stuff
  }
}
```

The first parameter, `invocationEventData`, is the event data with which the Lambda function is invoked. It's the first parameter provided by Lambda. The second, `executionContext` is the second parameter provided to the Lambda function which contains useful [runtime information](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html).

`serverless-chrome` calls the [Lambda handlers `callback()`](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html#nodejs-prog-model-handler-callback) for you when your handler function completes. The result of your handler is passed to callback with `callback(null, yourHandlerResult)`. If your handler throws an error, callback is called with `callback(yourHandlerError)`.

For example, to create a handler which returns the version info of the Chrome DevTools Protocol, you could modify `/config.js` to:

```js
import Cdp from 'chrome-remote-interface'

export default {
  async handler (event) {

    const versionInfo = await Cdp.Version()

    return {
      statusCode: 200,
      body: JSON.stringify({
        versionInfo,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  },
}
```

To capture all of the Network Request events made when loading a URL, you could modify `/config.js` to something like:

```js
import Cdp from 'chrome-remote-interface'
import { sleep } from './src/utils'

const LOAD_TIMEOUT = 1000 * 30

export default {
  async handler (event) {
    const requestsMade = []
    let loaded = false

    const loading = async (startTime = Date.now()) => {
      if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
        await sleep(100)
        await loading(startTime)
      }
    }

    const [tab] = await Cdp.List()
    const client = await Cdp({ host: '127.0.0.1', target: tab })

    const { Network, Page } = client

    Network.requestWillBeSent(params => requestsMade.push(params))

    Page.loadEventFired(() => {
      loaded = true
    })

    // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-enable
    await Network.enable()

    // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-enable
    await Page.enable()

    // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigate
    await Page.navigate({ url: 'https://www.chromium.org/' })

    // wait until page is done loading, or timeout
    await loading()

    // It's important that we close the websocket connection,
    // or our Lambda function will not exit properly
    await client.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        requestsMade,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  },
}
```

See [`src/handlers`](https://github.com/adieuadieu/serverless-chrome/tree/master/src/handlers) for more examples.

**TODO**: talk about CDP and [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)


## Known Issues / Limitations
1. hack to chrome code to disable `/dev/shm`.
1. `/tmp` size on Lambda
1. it might not be the most cost efficient to do this on Lambda vs. EC2


## Roadmap

*1.0*

1. Don't force the use of Serverless-framework. See [Issue #4](https://github.com/adieuadieu/serverless-chrome/issues/4)
    1. Refactor the headless Chrome bundle and Chrome spawning code into an npm package
    1. Create a Serverless plugin, using above npm package
1. OMG OMG [Get unit tests up to snuff!](https://github.com/adieuadieu/serverless-chrome/issues/5)
1. Example serverless services using headless-chrome
    1. Printing a URL to a PDF
    1. Loading a page and taking a screenshot, with options on viewport size and device settings
    1. DOM manipulation and scraping

*Future*

1. Support for Google Cloud Functions
1. Support for Azure Functions?
1. Example handler with [nightmarejs](https://github.com/segmentio/nightmare) (if this is even possible?)


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


## Projects & Companies using serverless-chrome

Tell us about your project on the [Wiki](https://github.com/adieuadieu/serverless-chrome/wiki/Projects-&amp;-Companies-Using-serverless-chrome)!


## Change log

See the [CHANGELOG](https://github.com/adieuadieu/serverless-chrome/blob/master/CHANGELOG.md)


## Prior Art

This project was inspired in various ways by the following projects:

- [PhantomJS](http://phantomjs.org/)
- [wkhtmltopdf](https://github.com/wkhtmltopdf/wkhtmltopdf)
- [node-webkitgtk](https://github.com/kapouer/node-webkitgtk)
- [electron-pdf](https://github.com/Janpot/electron-pdf)






[![CircleCI](https://img.shields.io/circleci/project/github/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://circleci.com/gh/adieuadieu/serverless-chrome)
[![Coveralls](https://img.shields.io/coveralls/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://coveralls.io/github/adieuadieu/serverless-chrome)
[![Codacy grade](https://img.shields.io/codacy/grade/cd743cc370104d49a508cc4b7689c1aa.svg?style=flat-square)](https://www.codacy.com/app/adieuadieu/serverless-chrome)
[![David](https://img.shields.io/david/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/adieuadieu/serverless-chrome.svg?style=flat-square)]()
