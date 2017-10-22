import * as path from 'path'
import { SUPPORTED_PROVIDERS, SUPPORTED_RUNTIMES } from './constants'

export function throwIfUnsupportedProvider (provider) {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error('The "serverless-plugin-headless-chrome" plugin currently only supports AWS Lambda. ' +
        `Your service is using the "${provider}" provider.`)
  }
}

export function throwIfUnsupportedRuntime (runtime) {
  if (!SUPPORTED_RUNTIMES.includes(runtime)) {
    throw new Error('The "serverless-plugin-headless-chrome" plugin only supports the Node.js 6.10 runtime. ' +
        `Your service is using the "${runtime}" provider.`)
  }
}

export function throwIfWrongPluginOrder (plugins) {
  const comesBefore = ['serverless-plugin-typescript']
  const comesAfter = ['serverless-webpack']

  const ourIndex = plugins.indexOf('serverless-plugin-chrome')

  plugins.forEach((plugin, index) => {
    if (comesBefore.includes(plugin) && ourIndex < index) {
      throw new Error(`The plugin "${plugin}" should appear before the "serverless-plugin-chrome"` +
          ' plugin in the plugin configuration section of serverless.yml.')
    }

    if (comesAfter.includes(plugin) && ourIndex > index) {
      throw new Error(`The plugin "${plugin}" should appear after the "serverless-plugin-chrome"` +
          ' plugin in the plugin configuration section of serverless.yml.')
    }
  })
}

export function getHandlerFileAndExportName (handler = '') {
  const fileParts = handler.split('.')
  const exportName = fileParts.pop()
  const file = fileParts.join('.')

  return {
    filePath: path.dirname(file),
    fileName: `${path.basename(file)}.js`, // is it OK to assume .js?
    exportName,
  }
}
