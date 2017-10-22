export const SERVERLESS_FOLDER = '.serverless'
export const BUILD_FOLDER = '.build'

export const SUPPORTED_PROVIDERS = ['aws']
export const SUPPORTED_RUNTIMES = ['nodejs6.10']

export const INCLUDES = [
  'node_modules/@serverless-chrome/lambda/package.json',
  'node_modules/@serverless-chrome/lambda/dist/bundle.cjs.js',
  'node_modules/@serverless-chrome/lambda/dist/headless-chromium',
]
