import { Launcher as LocalChromeLauncher } from 'chrome-launcher'
import LambdaChromeLauncher from './launcher'
import { debug } from './utils'
import DEFAULT_CHROME_FLAGS from './flags'

const DEVTOOLS_PORT = 9222
const DEVTOOLS_HOST = 'http://127.0.0.1'

// persist the instance across invocations
// when the *lambda* container is reused.
let chromeInstance

export default async function launch (
  { flags = [], chromePath, port = DEVTOOLS_PORT, forceLambdaLauncher = false } = {}
) {
  const chromeFlags = [...DEFAULT_CHROME_FLAGS, ...flags]

  if (!chromeInstance) {
    if (process.env.AWS_EXECUTION_ENV || forceLambdaLauncher) {
      chromeInstance = new LambdaChromeLauncher({
        chromePath,
        chromeFlags,
        port,
      })
    } else {
      chromeInstance = new LocalChromeLauncher({ chromePath, chromeFlags, port })
    }
  }

  debug('Spawning headless shell')

  const launchStartTime = Date.now()
  await chromeInstance.launch()
  const launchTime = Date.now() - launchStartTime

  debug(`It took ${launchTime}ms to spawn chrome.`)

  // unref the chrome instance, otherwise the lambda process won't end correctly
  if (chromeInstance.chrome) {
    chromeInstance.chrome.removeAllListeners()
    chromeInstance.chrome.unref()
  }

  return {
    pid: chromeInstance.pid,
    port: chromeInstance.port,
    url: `${DEVTOOLS_HOST}:${chromeInstance.port}`,
    kill: () => {
      chromeInstance.kill()
      chromeInstance = undefined
    },
    log: chromeInstance.outFile,
    errorLog: chromeInstance.errFile,
    pidFile: chromeInstance.pidFile,
    metaData: {
      launchTime,
      didLaunch: !!chromeInstance.pid,
    },
  }
}
