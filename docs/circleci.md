# CircleCI Setup

How to setup Circle CI for continuous integration/deployment (aka notes for project maintainer in case they forget).

Jobs and workflows defined in `~/.circleci/config.yml`

## Build Settings

### Environment Variables

For automated releases, environment requires the following variables:

- **AWS_IAM_INSTANCE_ARN** - The instance Arn for Spot instances launched when new binaries are to be built. Something like `arn:aws:iam::000000000000:instance-profile/serverless-chrome-automation`
- **AWS_REGION** - Region in which to launch spot instances
- **NPM_TOKEN** - NPM token for publishing packages. Use a bot account!
- **GIT_USER_EMAIL** - email for commits made during Continuous Deployment processes.
- **GIT_USER_NAME** - user's name for commits made during Continuous Deployment processes

Bla bla:

- CODACY_PROJECT_TOKEN
- COVERALLS_REPO_TOKEN
- COVERALLS_SERVICE_NAME

### Advanced Settings

- **Pass secrets to builds from forked pull requests**: Off!


## Permissions

### Checkout SSH Keys

Yes. Requires a user key for github.com so that nightly binary versions updates can be tagged/released when appropriate. Use a bot account!


### AWS Permissions

Yes. Needed.

