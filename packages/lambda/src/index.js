import path from 'path'
import { Launcher as ChromeLauncher } from 'lighthouse/chrome-launcher/chrome-launcher'

const debug = require('debug')('@serverless-chrome/lambda')

const CHROME_PATH = path.resolve(__dirname, './headless_shell')
const DEVTOOLS_PORT = 9222
const DEVTOOLS_HOST = 'http://127.0.0.1'
const LOGGING_FLAGS = process.env.DEBUG ? ['--enable-logging', '--log-level=0', '--v=99'] : []

export default async function launch (options = { flags: [] }) {
  const chromeFlags = [
    ...LOGGING_FLAGS,
    '--disable-gpu',
    '--single-process', // Currently wont work without this :-(
    '--no-sandbox',
    ...options.flags,
  ]
  let chromePath

  if (process.env.AWS_EXECUTION_ENV) {
    chromePath = CHROME_PATH
  }

  debug('Spawning headless shell with: ', chromePath, chromeFlags.join(' '))

  const instance = new ChromeLauncher({ chromeFlags, chromePath, port: DEVTOOLS_PORT })

  const launchStartTime = Date.now()
  await instance.launch()
  const launchTime = Date.now() - launchStartTime

  debug(`It took ${launchTime}ms to spawn chrome.`)

  // unref the chrome instance, otherwise the lambda process won't end correctly
  if (instance.chrome) {
    instance.chrome.removeAllListeners()
    instance.chrome.unref()
  }

  // Note:
  // instance.outFile, errFile, pidFile are private fields on the ChromeLaunch class.
  // If private fields become standard JS, this may break the following usage at some point.

  // @TODO: we could store 'instance' in a global var,
  // such that it can be retrieved inbetween lambda invocations

  return {
    pid: instance.pid,
    port: instance.port,
    url: `${DEVTOOLS_HOST}:${instance.port}`,
    kill: () => instance.kill(),
    log: instance.outFile,
    errorLog: instance.errFile,
    pidFile: instance.pidFile,
    metaData: {
      launchTime,
      didLaunch: !!instance.pid,
    },
  }
}
