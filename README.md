# serverless-chrome

Serverless Chrome contains everything you need to get started running headless Chrome on AWS Lambda (possibly Azure and GCP Functions soon).

The aim of this project is to provide the scaffolding for using Headless Chrome during a serverless function invocation. Serverless Chrome takes care of building and bundling the Chrome binaries and making sure Chrome is running when your serverless function executes. In addition, this project also provides a few "example" handlers for common patterns (e.g. taking a screenshot of a page, printing to PDF, some scraping, etc.)

Why? Because it's neat. It also opens up interesting possibilities for using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/) in serverless architectures.


[![CircleCI](https://img.shields.io/circleci/project/github/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://circleci.com/gh/adieuadieu/serverless-chrome)
[![Coveralls](https://img.shields.io/coveralls/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://coveralls.io/github/adieuadieu/serverless-chrome)
[![Codacy grade](https://img.shields.io/codacy/grade/cd743cc370104d49a508cc4b7689c1aa.svg?style=flat-square)](https://www.codacy.com/app/adieuadieu/serverless-chrome)
[![David](https://img.shields.io/david/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![GitHub release](https://img.shields.io/github/release/adieuadieu/serverless-chrome.svg?style=flat-square)](https://github.com/adieuadieu/serverless-chrome)


## Contents
1. [Quick Start](#quick-start)
1. [Examples](#examples)
1. [Chrome Version](#chrome-version)
1. [Testing](#testing)
1. [Known Issues / Limitations](#known-issues-limitations)
1. [Roadmap](#roadmap)
1. [Projects & Companies using serverless-chrome](#projects--companies-using-serverless-chrome)
1. [Change log](#change-log)
1. [Prior Art](#prior-art)


## Quick Start

Using AWS Lambda, the quickest way to get started is with the [Serverless-framework](https://serverless.com/) CLI.

First, install `serverless` globally:

```bash
npm install serverless -g
```

Then pull down the example service:

```bash
serverless install -u https://github.com/adieuadieu/serverless-chrome/tree/master/examples/serverless-framework/aws
```

Then, you must configure your AWS credentials either by defining `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environmental variables, or using an AWS profile. You can read more about this on the [Serverless Credentials Guide](https://serverless.com/framework/docs/providers/aws/guide/credentials/).

In short, either:

```bash
export AWS_PROFILE=<your-profile-name>
```

or

```bash
export AWS_ACCESS_KEY_ID=<your-key-here>
export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
```

Then, to deploy the service and all of its functions:

```bash
serverless deploy
```

Further details are available in the [Serverless Lambda example](https://github.com/adieuadieu/serverless-chrome/tree/master/examples/serverless-framework/aws).


# Examples

A collection of example functions for different providers and frameworks.

### Serverless-framework

- [Serverless-framework](https://github.com/adieuadieu/serverless-chrome/tree/master/examples/serverless-framework/aws)
  Some simple functions for the [Serverless-framework](https://serverless.com/) on AWS Lambda. It includes the following example functions:

  - Print to PDF
  - Capture Screenshot
  - Page-load Request Logger


## Chrome Version

The current Chrome build is:

- **Browser**: HeadlessChrome/60.0.3095.0
- **Protocol-Version**: 1.2
- **User-Agent**: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/60.0.3095.0 Safari/537.36
- **V8-Version**: 6.0.184
- **WebKit-Version**: 537.36 (@947514553066c623a85712d05c3a01bd1bcbbffc)


## Testing

Test with `yarn test` or just `yarn ava` to skip the linter.


## Known Issues / Limitations

1. Hack to Chrome code to disable `/dev/shm`. Details [here](https://medium.com/@marco.luethy/running-headless-chrome-on-aws-lambda-fa82ad33a9eb).
1. `/tmp` size on Lambda is only about 500MB.
1. For steady/consistent load, it might not be the most cost efficient to do this on Lambda vs. EC2


## Roadmap

*1.1*

1. Support for Google Cloud Functions

*1.2*

1. DOM manipulation and scraping example handler

*Future*

1. Support for Azure Functions (Once Headless Chrome supports Windows)



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
