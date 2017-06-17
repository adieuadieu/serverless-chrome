/* Borrows from serverless-plugin-typescript
  https://github.com/graphcool/serverless-plugin-typescript/blob/master/src/index.ts
*/

/*
@TODO:
  - handle package.individually?
    https://github.com/serverless/serverless/blob/master/lib/plugins/package/lib/packageService.js#L37
  - support for enabling chrome only one specific functions?
  - instead of using a wrapper, might be cooler to use the AST and rewrite the handler function
  - instead of including fs-p dep, use the fs methods from the Utils class provided by Serverless
  - tests.
*/

import * as path from 'path'
import * as fs from 'fs-p'
import globby from 'globby'

const SERVERLESS_FOLDER = '.serverless'
const BUILD_FOLDER = '.build'

const SUPPORTED_PROVIDERS = ['aws']
const SUPPORTED_RUNTIMES = ['nodejs6.10']

const INCLUDES = [
  'node_modules/@serverless-chrome/lambda/package.json',
  'node_modules/@serverless-chrome/lambda/dist/bundle.cjs.js',
  'node_modules/@serverless-chrome/lambda/dist/headless_shell',
]

function getHandlerFileAndExportName (handler = '') {
  const fileParts = handler.split('.')
  const exportName = fileParts.pop()
  const file = fileParts.join('.')

  return {
    filePath: path.dirname(file),
    fileName: `${path.basename(file)}.js`, // is it OK to assume .js?
    exportName,
  }
}

export default class ServerlessChrome {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options

    const { name: providerName, runtime } = serverless.service.provider

    if (!SUPPORTED_PROVIDERS.includes(providerName)) {
      throw new Error(
        'The "serverless-plugin-headless-chrome" plugin currently only supports AWS Lambda. ' +
          `Your service is using the "${providerName}" provider.`
      )
    }

    if (!SUPPORTED_RUNTIMES.includes(runtime)) {
      throw new Error(
        'The "serverless-plugin-headless-chrome" plugin only supports the Node.js 6.10 runtime. ' +
          `Your service is using the "${runtime}" provider.`
      )
    }

    this.hooks = {
      // 'before:offline:start:init': this.beforeCreateDeploymentArtifacts.bind(this),
      'before:package:createDeploymentArtifacts': this.beforeCreateDeploymentArtifacts.bind(this),
      'after:package:createDeploymentArtifacts': this.afterCreateDeploymentArtifacts.bind(this),
      // 'before:deploy:createDeploymentArtifacts': this.beforeCreateDeploymentArtifacts.bind(this),
      // 'before:invoke:local:invoke': this.beforeCreateDeploymentArtifacts.bind(this),
      // 'after:invoke:local:invoke': this.cleanup.bind(this),
    }
  }

  async beforeCreateDeploymentArtifacts () {
    const {
      config,
      cli,
      utils,
      service,
      service: { provider: { name: providerName, runtime } },
      variables,
    } = this.serverless

    service.package.include = service.package.include || []

    cli.log('Injecting Headless Chrome...')

    // Save original service path and functions
    this.originalServicePath = config.servicePath

    // Fake service path so that serverless will know what to zip
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
    if (service.package.include.length) {
      const files = await globby(service.package.include)

      files.forEach((filename) => {
        const destFileName = path.resolve(path.join(BUILD_FOLDER, filename))
        const dirname = path.dirname(destFileName)

        if (!fs.existsSync(dirname)) {
          fs.mkdirpSync(dirname)
        }

        if (!fs.existsSync(destFileName)) {
          fs.copySync(path.resolve(filename), path.resolve(path.join(BUILD_FOLDER, filename)))
        }
      })
    }

    // Add our node_modules dependencies to the package includes
    service.package.include = [...service.package.include, ...INCLUDES]

    await Promise.all(
      service.getAllFunctions().map(async (functionName) => {
        const { handler } = service.getFunction(functionName)
        const { filePath, fileName, exportName } = getHandlerFileAndExportName(handler)
        const handlerCodePath = path.join(config.servicePath, filePath)
        const originalFileRenamed = `${utils.generateShortId()}___${fileName}`

        const chromeFlags = service.custom.chromeFlags || []

        // Read in the wrapper handler code template
        const wrapperTemplate = await utils.readFile(
          path.resolve(__dirname, '..', 'src', `wrapper-${providerName}-${runtime}.js`)
        )

        // Include the original handler via require
        const wrapperCode = wrapperTemplate
          .replace("'REPLACE_WITH_HANDLER_REQUIRE'", `require('./${originalFileRenamed}')`)
          .replace(
            "'REPLACE_WITH_OPTIONS'",
            `{ ${chromeFlags.length ? `chromeFlags: ['${chromeFlags.join("', '")}']` : ''} }`
          )
          .replace(/REPLACE_WITH_EXPORT_NAME/gm, exportName)
        // Move the original handler's file aside
        await fs.move(
          path.resolve(handlerCodePath, fileName),
          path.resolve(handlerCodePath, originalFileRenamed)
        )

        // Write the wrapper code to the function's handler path
        await utils.writeFile(path.resolve(handlerCodePath, fileName), wrapperCode)
      })
    )
  }

  async afterCreateDeploymentArtifacts () {
    // Copy .build to .serverless
    await fs.copy(
      path.join(this.originalServicePath, BUILD_FOLDER, SERVERLESS_FOLDER),
      path.join(this.originalServicePath, SERVERLESS_FOLDER)
    )

    this.serverless.service.package.artifact = path.join(
      this.originalServicePath,
      SERVERLESS_FOLDER,
      path.basename(this.serverless.service.package.artifact)
    )

    // Cleanup after everything is copied
    await this.cleanup()
  }

  async cleanup () {
    // Restore service path
    this.serverless.config.servicePath = this.originalServicePath

    // Remove temp build folder
    fs.removeSync(path.join(this.originalServicePath, BUILD_FOLDER))
  }
}
