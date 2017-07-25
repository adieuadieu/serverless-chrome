# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).


## [Unreleased]
### Added
- serverless-plugin-chrome: support for selecting which functions to enable Chrome on with the `custom.chrome.functions` parameter.
- @serverless-chrome/lambda NPM package
- serverless-plugin-chrome NPM package for Serverless-framework
- CHANGELOG.md.

### Changed
- example Serverless-framework printToPdf function handler to use the Serverless plugin
- example Serverless-framework captureScreenshot function handler to use the Serverless plugin


## [0.5.0] - 2017-03-11, 2017-05-09
### Added
- Headless Chrome headless_shell binary version 60.0.3089.0 built for AWS Lambda
- Serverless-framework configuration for deploying to AWS Lambda
- sample printToPdf Lambda function handler
- sample captureScreenshot Lambda function handler
- Initial documentation in README.md
