import fs from 'fs'
// import path from 'path'
import LambdaChromeLauncher from './launcher'
import { debug, processExists } from './utils'
import DEFAULT_CHROME_FLAGS from './flags'

const DEVTOOLS_PORT = 9222
const DEVTOOLS_HOST = 'http://127.0.0.1'

// Prepend NSS related libraries and binaries to the library path and path respectively on lambda.
/* if (process.env.AWS_EXECUTION_ENV) {
  const nssSubPath = fs.readFileSync(path.join(__dirname, 'nss', 'latest'), 'utf8').trim();
  const nssPath = path.join(__dirname, 'nss', subnssSubPathPath);

  process.env.LD_LIBRARY_PATH = path.join(nssPath, 'lib') +  ':' + process.env.LD_LIBRARY_PATH;
  process.env.PATH = path.join(nssPath, 'bin') + ':' + process.env.PATH;
} */

// persist the instance across invocations
// when the *lambda* container is reused.
let chromeInstance

export default async function launch ({
  flags = [],
  chromePath,
  port = DEVTOOLS_PORT,
  forceLambdaLauncher = false,
} = {}) {
  const chromeFlags = [...DEFAULT_CHROME_FLAGS, ...flags]

  if (!chromeInstance || !processExists(chromeInstance.pid)) {
    if (process.env.AWS_EXECUTION_ENV || forceLambdaLauncher) {
      chromeInstance = new LambdaChromeLauncher({
        chromePath,
        chromeFlags,
        port,
      })
    } else {
      // This let's us use chrome-launcher in local development,
      // but omit it from the lambda function's zip artefact
      try {
        // eslint-disable-next-line
        const { Launcher: LocalChromeLauncher } = require('chrome-launcher')
        chromeInstance = new LocalChromeLauncher({
          chromePath,
          chromeFlags: flags,
          port,
        })
      } catch (error) {
        throw new Error('@serverless-chrome/lambda: Unable to find "chrome-launcher". ' +
            "Make sure it's installed if you wish to develop locally.")
      }
    }
  }

  debug('Spawning headless shell')

  const launchStartTime = Date.now()

  try {
    await chromeInstance.launch()
  } catch (error) {
    debug('Error trying to spawn chrome:', error)

    if (process.env.DEBUG) {
      debug(
        'stdout log:',
        fs.readFileSync(`${chromeInstance.userDataDir}/chrome-out.log`, 'utf8')
      )
      debug(
        'stderr log:',
        fs.readFileSync(`${chromeInstance.userDataDir}/chrome-err.log`, 'utf8')
      )
    }

    throw new Error('Unable to start Chrome. If you have the DEBUG env variable set,' +
        'there will be more in the logs.')
  }

  const launchTime = Date.now() - launchStartTime

  debug(`It took ${launchTime}ms to spawn chrome.`)

  // unref the chrome instance, otherwise the lambda process won't end correctly
  /* @TODO: make this an option?
    There's an option to change callbackWaitsForEmptyEventLoop in the Lambda context
    http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    Which means you could log chrome output to cloudwatch directly
    without unreffing chrome.
  */
  if (chromeInstance.chrome) {
    chromeInstance.chrome.removeAllListeners()
    chromeInstance.chrome.unref()
  }

  return {
    pid: chromeInstance.pid,
    port: chromeInstance.port,
    url: `${DEVTOOLS_HOST}:${chromeInstance.port}`,
    log: `${chromeInstance.userDataDir}/chrome-out.log`,
    errorLog: `${chromeInstance.userDataDir}/chrome-err.log`,
    pidFile: `${chromeInstance.userDataDir}/chrome.pid`,
    metaData: {
      launchTime,
      didLaunch: !!chromeInstance.pid,
    },
    async kill () {
      // Defer killing chrome process to the end of the execution stack
      // so that the node process doesn't end before chrome exists,
      // avoiding chrome becoming orphaned.
      setTimeout(async () => {
        chromeInstance.kill()
        chromeInstance = undefined
      }, 0)
    },
  }
}
