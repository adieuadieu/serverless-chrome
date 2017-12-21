/*
@TODO:
  - handle package.individually?
    https://github.com/serverless/serverless/blob/master/lib/plugins/package/lib/packageService.js#L37
  - support for enabling chrome only on specific functions?
  - instead of including fs-p dep, use the fs methods from the Utils class provided by Serverless
    or use fs-extra directly.
  - config option to, instead of including chrome in artifact zip, download it on
    cold-start invocations this could be useful for development, instead of having
    to upload 50MB each deploy
  - tests.
  - custom.chrome.functions breaks when a wrapped and non-wrapped function have the
    same handler.js file
*/

import * as path from 'path'
import * as fs from 'fs-p' // deprecated. use fs-extra?
import globby from 'globby'

import { SERVERLESS_FOLDER, BUILD_FOLDER, INCLUDES } from './constants'
import {
  throwIfUnsupportedProvider,
  throwIfUnsupportedRuntime,
  throwIfWrongPluginOrder,
  getHandlerFileAndExportName,
} from './utils'

export default class ServerlessChrome {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options

    const { provider: { name: providerName, runtime }, plugins } = serverless.service

    throwIfUnsupportedProvider(providerName)
    throwIfUnsupportedRuntime(runtime)
    throwIfWrongPluginOrder(plugins)

    this.hooks = {
      'before:offline:start:init': this.beforeCreateDeploymentArtifacts.bind(this),
      'before:package:createDeploymentArtifacts': this.beforeCreateDeploymentArtifacts.bind(this),
      'after:package:createDeploymentArtifacts': this.afterCreateDeploymentArtifacts.bind(this),
      'before:invoke:local:invoke': this.beforeCreateDeploymentArtifacts.bind(this),
      'after:invoke:local:invoke': this.cleanup.bind(this),

      'before:webpack:package:packExternalModules': this.webpackPackageBinaries.bind(this),
    }

    // only mess with the service path if we're not already known to be within a .build folder
    this.messWithServicePath = !plugins.includes('serverless-plugin-typescript')

    // annoyingly we have to do stuff differently if using serverless-webpack plugin. lame.
    this.webpack = plugins.includes('serverless-webpack')
  }

  async webpackPackageBinaries () {
    const { servicePath } = this.serverless.config

    await fs.copy(
      path.join(servicePath, 'node_modules/@serverless-chrome/lambda/dist/headless-chromium'),
      path.resolve(servicePath, '.webpack/service/headless-chromium')
    )
  }

  async beforeCreateDeploymentArtifacts () {
    const {
      config,
      cli,
      utils,
      service,
      service: { provider: { name: providerName, runtime } },
    } = this.serverless

    const functionsToWrap =
      (service.custom && service.custom.chrome && service.custom.chrome.functions) ||
      service.getAllFunctions()

    service.package.include = service.package.include || []

    cli.log('Injecting Headless Chrome...')

    // Save original service path and functions
    this.originalServicePath = config.servicePath

    // Fake service path so that serverless will know what to zip
    // Unless, we're already in a .build folder from another plugin
    if (this.messWithServicePath) {
      config.servicePath = path.join(this.originalServicePath, BUILD_FOLDER)

      if (!fs.existsSync(config.servicePath)) {
        fs.mkdirpSync(config.servicePath)
      }

      // include node_modules into build
      if (!fs.existsSync(path.resolve(path.join(BUILD_FOLDER, 'node_modules')))) {
        fs.symlinkSync(
          path.resolve('node_modules'),
          path.resolve(path.join(BUILD_FOLDER, 'node_modules'))
        )
      }

      // include any "extras" from the "include" section
      const files = await globby([...service.package.include, '**', '!node_modules/**'], {
        cwd: this.originalServicePath,
      })

      files.forEach((filename) => {
        const sourceFile = path.resolve(path.join(this.originalServicePath, filename))
        const destFileName = path.resolve(path.join(config.servicePath, filename))

        const dirname = path.dirname(destFileName)

        if (!fs.existsSync(dirname)) {
          fs.mkdirpSync(dirname)
        }

        if (!fs.existsSync(destFileName)) {
          fs.copySync(sourceFile, destFileName)
        }
      })
    }

    // Add our node_modules dependencies to the package includes
    service.package.include = [...service.package.include, ...INCLUDES]

    await Promise.all(functionsToWrap.map(async (functionName) => {
      const { handler } = service.getFunction(functionName)
      const { filePath, fileName, exportName } = getHandlerFileAndExportName(handler)
      const handlerCodePath = path.join(config.servicePath, filePath)

      const originalFileRenamed = `${utils.generateShortId()}___${fileName}`

      const customPluginOptions = (service.custom && service.custom.chrome) || {}

      const launcherOptions = {
        ...customPluginOptions,
        flags: customPluginOptions.flags || [],
        chromePath: this.webpack ? '/var/task/headless-chromium' : undefined,
      }

      // Read in the wrapper handler code template
      const wrapperTemplate = await utils.readFile(path.resolve(__dirname, '..', 'src', `wrapper-${providerName}-${runtime}.js`))

      // Include the original handler via require
      const wrapperCode = wrapperTemplate
        .replace("'REPLACE_WITH_HANDLER_REQUIRE'", `require('./${originalFileRenamed}')`)
        .replace("'REPLACE_WITH_OPTIONS'", JSON.stringify(launcherOptions))
        .replace(/REPLACE_WITH_EXPORT_NAME/gm, exportName)

        // Move the original handler's file aside
      await fs.move(
        path.resolve(handlerCodePath, fileName),
        path.resolve(handlerCodePath, originalFileRenamed)
      )

      // Write the wrapper code to the function's handler path
      await utils.writeFile(path.resolve(handlerCodePath, fileName), wrapperCode)
    }))
  }

  async afterCreateDeploymentArtifacts () {
    if (this.messWithServicePath) {
      // Copy .build to .serverless
      await fs.copy(
        path.join(this.originalServicePath, BUILD_FOLDER, SERVERLESS_FOLDER),
        path.join(this.originalServicePath, SERVERLESS_FOLDER)
      )

      // this.serverless.service.package.artifact = path.join(
      //   this.originalServicePath,
      //   SERVERLESS_FOLDER
      //   path.basename(this.serverless.service.package.artifact)
      // )

      // Cleanup after everything is copied
      await this.cleanup()
    }
  }

  async cleanup () {
    // Restore service path
    this.serverless.config.servicePath = this.originalServicePath

    // Remove temp build folder
    fs.removeSync(path.join(this.originalServicePath, BUILD_FOLDER))
  }
}
