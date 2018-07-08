# Serverless-framework based Example Functions

A collection of [Serverless-framework](https://github.com/serverless/serverless) based functions for AWS Lambda demonstrating the `serverless-plugin-chrome` plugin for Serverless to run Headless Chrome serverless-ly. The example functions include:
  - A Print to PDF handler
  - A Capture Screenshot handler
  - A Page-load Request Logger handler
  - A Version Info handler (💤 )


## Contents
1. [Installation](#installation)
1. [Credentials](#credentials)
1. [Deployment](#deployment)
1. [Example Functions](#example-functions)
1. [Local Development](#local-development)
1. [Configuration](#configuration)


## Installation

First, install `serverless` globally:

```bash
npm install serverless -g
```

Then pull down the example service:

```bash
serverless create -u \
  https://github.com/adieuadieu/serverless-chrome/tree/master/examples/serverless-framework/aws
```

And install the dependencies:

```bash
npm install
```

## Credentials

_We recommend using a tool like [AWS Vault](https://github.com/99designs/aws-vault) to manage your AWS credentials._

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

## Deployment

Once Credentials are set up, to deploy the full service run:

```bash
npm run deploy
```

## Example Functions

This example service includes the following functions, each demonstrating a common pattern/use-case.


### Capture Screenshot of a given URL
 When you the serverless function, it creates a Lambda function which will take a screenshot of a URL it's provided. You can provide this URL to the Lambda function via the AWS API Gateway. After a successful deploy, an API endpoint will be provided. Use this URL to call the Lambda function with a url in the query string. E.g. `https://XXXXXXX.execute-api.us-east-1.amazonaws.com/dev/screenshot?url=https://github.com/adieuadieu/serverless-chrome`. Add `&mobile=1` for mobile device view.

#### Deploying

To deploy the Capture Screenshot function:

```bash
serverless deploy -f screenshot
```

### Print a given URL to PDF
The printToPdf handler will create a PDF from a URL it's provided. You can provide this URL to the Lambda function via the AWS API Gateway. After a successful deploy, an API endpoint will be provided. Use this URL to call the Lambda function with a url in the query string. E.g. `https://XXXXXXX.execute-api.us-weeast-2.amazonaws.com/dev/pdf?url=https://github.com/adieuadieu/serverless-chrome`

This handler also supports configuring the "paper" size, orientation, etc. You can pass any of the DevTools Protocol's [`Page.printToPdf()`](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-printToPDF]) method's parameters. For example, for landscape oriented PDF add `&landscape=true` to the end of the URL. Be sure to remember to escape the value of `url` if it contains query parameters. E.g. `https://XXXXXXX.execute-api.us-east-1.amazonaws.com/dev/pdf?url=https://github.com/adieuadieu/serverless-chrome&landscape=true`

#### Deploying

To deploy the Capture Screenshot function:

```bash
serverless deploy -f pdf
```


### Page-load Request Logger
Returns an array of every request which was made loading a given page.

#### Deploying

To deploy the Page-load Request Logger function:

```bash
serverless deploy -f request-logger
```


### Chrome Version Info
 Prints version info of headless chrome binary

#### Deploying

To deploy the Chrome Version Info function:

```bash
serverless deploy -f version-info
```

## Configuration

These are simple functions and don't offer any configuration options. Take a look at the `serverless-plugins-chrome` plugin's [README](/packages/serverless-plugin) for it's configuration options.


## Local Development

Go for it. Locally, if installed, Chrome will be launched. More in the plugin's [README](/packages/serverless-plugin).

Invoke a function locally with:

```bash
serverless invoke local -f replaceThisWithTheFunctionName
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
