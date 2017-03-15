# serverless-chrome

Serverless Chrome contains everything you need to get started running headless Chrome on AWS Lambda (possibly Azure and GCP Functions soon).

Why? Because it's neat. It also opens up interesting possibilities for using the [Chrome Debugger Protocol](https://developer.chrome.com/devtools/docs/debugger-protocol) in serverless architectures. Maybe.

The aim of this project is to provide the scaffolding for using Headless Chrome during a serverless function invocation. We'll take care of building and bundling the chrome binaries and making sure Chrome is running, and you figure out something useful to do with it. In addition, this project will provide a few "example" handlers for common patterns (e.g. taking a screenshot of a page, printing to PDF, some scraping, etc.)

**Caution**: This project is in it's infancy and evolving quickly. Pull requests and Issues are welcome!

**Apologies**: This README is incomplete & very unpolished.



## Contents
1. [What is it?](#what-is-it)
1. [Installation](#installation)
1. [Setup](#setup)
1. [Testing](#testing)
1. [Configuration and Deployment](#configuration-and-deployment)
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

- **Browser**: HeadlessChrome/59.0.3039.0
- **User-Agent**: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/59.0.3039.0 Safari/537.36
- **V8-Version**: 5.9.35
- **WebKit-Version**: 537.36 (@85eb0199323407db76feaa192e0d0a0fd9b24f6f)


## Configuration

You can override default configuration in the `/config.js` file generated at the root of the project after a `yarn install`. See the defaults in `src/config.js` for a full list of configuration options.

### Example Handlers

###### captureScreenshot: Capture Screenshot of a given URL
Currently there is only a single, very basic "proof of concept" type function. When you the serverless function, it creates a Lambda function which will take a screenshot of a URL it's provided. You can provide this URL to the Lambda function via the AWS API Gateway. After a successful deploy, an API endpoint will be provided. Use this URL to call the Lambda function with a url in the query string. E.g. `https://XXXXXXX.execute-api.us-west-2.amazonaws.com/dev/chrome?url=https://google.com/`

We're using API Gateway as our method to execute the function, but of course it's possible to use any other available triggers to kick things off be it an event from S3, SNS, DynamoDB, etc.
**TODO**: explain how --^


### Custom Handlers

You can provide your own handler via the `config.js` file created when you initialize the project with `yarn install`. The config accepts a `handler` property. Pass it a function which returns a Promise when complete. For example:

_/config.js_
```js
export default {
  handler: async function(lambdaInvocationEvent, invocationContext) {
    const { queryStringParameters: { url } } = lambdaInvocationEvent
    const stuff = await doSomethingWith(url)
    return stuff
  }
}
```

See `src/handlers` for more examples.

**TODO**: talk about CDP and [chrome-remote-interface](https://github.com/cyrus-and/chrome-remote-interface)


## Known Issues / Limitations
1. ws@2/Buffer.from **TODO:** create, then add link to issue here
1. hack to chrome code to disable /dev/shm.
1. /tmp size on Lambda
1. it might not be the most cost efficient to do this on Lambda vs. EC2


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






[![CircleCI](https://img.shields.io/circleci/project/github/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://circleci.com/gh/adieuadieu/serverless-chrome)
[![Coveralls](https://img.shields.io/coveralls/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://coveralls.io/github/adieuadieu/serverless-chrome)
[![Codacy grade](https://img.shields.io/codacy/grade/cd743cc370104d49a508cc4b7689c1aa.svg?style=flat-square)](https://www.codacy.com/app/adieuadieu/serverless-chrome)
[![David](https://img.shields.io/david/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/adieuadieu/serverless-chrome.svg?style=flat-square)]()
