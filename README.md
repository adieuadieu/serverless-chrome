# serverless-chrome

Serverless Chrome contains everything you need to get started running headless Chrome on AWS Lambda (possibly Azure and GCP Functions soon).

The aim of this project is to provide the scaffolding for using Headless Chrome during a serverless function invocation. Serverless Chrome takes care of building and bundling the Chrome binaries and making sure Chrome is running when your serverless function executes. In addition, this project also provides a few example services for common patterns (e.g. taking a screenshot of a page, printing to PDF, some scraping, etc.)

Why? Because it's neat. It also opens up interesting possibilities for using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/tot/) (and tools like [Chromeless](https://github.com/graphcool/chromeless) or [Puppeteer](https://github.com/GoogleChrome/puppeteer)) in serverless architectures and doing testing/CI, web-scraping, pre-rendering, etc.


[![CircleCI](https://img.shields.io/circleci/project/github/adieuadieu/serverless-chrome/master.svg?style=flat-square)](https://circleci.com/gh/adieuadieu/serverless-chrome)
[![David](https://img.shields.io/david/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![David](https://img.shields.io/david/dev/adieuadieu/serverless-chrome.svg?style=flat-square)]()
[![GitHub release](https://img.shields.io/github/release/adieuadieu/serverless-chrome.svg?style=flat-square)](https://github.com/adieuadieu/serverless-chrome)


## Contents
1. [Quick Start](#quick-start)
1. [The Project](#the-project)
1. [Examples](#examples)
1. [Testing](#testing)
1. [Known Issues / Limitations](#known-issues--limitations)
1. [Roadmap](#roadmap)
1. [Projects & Companies using serverless-chrome](#projects--companies-using-serverless-chrome)
1. [Change log](#change-log)
1. [Prior Art](#prior-art)


## Quick Start

"Bla bla bla! I just want to start coding!" No problem:

Using AWS Lambda, the quickest way to get started is with the [Serverless-framework](https://serverless.com/) CLI.

First, install `serverless` globally and then:

```bash
serverless create -u https://github.com/adieuadieu/serverless-chrome/tree/master/serverless-chrome/examples/serverless-framework/aws
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
npm run deploy
```

Further details are available in the [Serverless Lambda example](examples/serverless-framework/aws).


## The Project

This project contains:

- **[@serverless-chrome/lambda](packages/lambda)** NPM package<br/>
  A standalone module for AWS Lambda which bundles and launches Headless Chrome with support for local development. For use with—but not limited to—tools like [Apex](https://github.com/apex/apex), [Claudia.js](https://github.com/claudiajs/claudia), or [Serverless](https://serverless.com/).
- **[serverless-plugin-chrome](packages/serverless-plugin)** NPM package<br/>
  A plugin for [Serverless-framework](https://serverless.com/) services which takes care of everything for you. You just write the code to drive Chrome.
- **[Example functions](examples/)**
  - [Serverless-framework](https://serverless.com/) AWS Lambda Node.js functions using `serverless-plugin-chrome`
- **[Build Automation](docs/automation.md) & (CI/CD)[.circleci/config.yml]**<br/>
   Build and release tooling shell scripts and Dockerfile for automating the build/release of headless Chrome for serverless environments (AWS Lambda).


## Examples

A collection of example functions for different providers and frameworks.

### Serverless-framework

- [Serverless-framework](examples/serverless-framework/aws)
  Some simple functions for the [Serverless-framework](https://serverless.com/) on AWS Lambda. It includes the following example functions:

  - Print to PDF
  - Capture Screenshot
  - Page-load Request Logger


## Testing

Test with `npm test`. Each package also contains it's own integration tests which can be run with `npm run test:integration`.


## Known Issues / Limitations

1. Hack to Chrome code to disable `/dev/shm`. Details [here](https://medium.com/@marco.luethy/running-headless-chrome-on-aws-lambda-fa82ad33a9eb).
1. `/tmp` size on Lambda is only about 500MB.


## Roadmap

*1.1*

1. Support for Google Cloud Functions
1. Example for Apex
1. Example for Claudia.js

*1.2*

1. DOM manipulation and scraping example handler

*Future*

1. Support for Azure Functions
1. Headless Firefox


## Projects & Companies using serverless-chrome

Tell us about your project on the [Wiki](https://github.com/adieuadieu/serverless-chrome/wiki/Projects-&amp;-Companies-Using-serverless-chrome)!


## Change log

See the [CHANGELOG](CHANGELOG.md)


## Prior Art

This project was inspired in various ways by the following projects:

- [PhantomJS](http://phantomjs.org/)
- [wkhtmltopdf](https://github.com/wkhtmltopdf/wkhtmltopdf)
- [node-webkitgtk](https://github.com/kapouer/node-webkitgtk)
- [electron-pdf](https://github.com/Janpot/electron-pdf)
