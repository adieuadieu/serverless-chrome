// import path from 'path'
import Puppeteer from 'puppeteer'
import { debug } from './utils'
import DEFAULT_CHROME_FLAGS from './flags'

// persist the instance across invocations
// when the *lambda* container is reused.
let puppeteerInstance

export default async function launch ({
  flags = [],
  chromePath,
  forceLambdaLauncher = false,
} = {}) {
  const chromeFlags = [...DEFAULT_CHROME_FLAGS, ...flags]
  const puppeteerOptions = {
    headless: true,
    args: chromeFlags,
  }

  if (!puppeteerInstance) {
    // We only need to overwrite the Chrome path on Lambda
    // Puppeteer installs with bundled Chromium that will work locally
    if (process.env.AWS_EXECUTION_ENV || forceLambdaLauncher) {
      puppeteerOptions.executablePath = chromePath
    }
  }

  debug('Spawning headless shell')

  const launchStartTime = Date.now()

  try {
    puppeteerInstance = await Puppeteer.launch(puppeteerOptions)
    debug(`Launch done: ${await puppeteerInstance.version()}`)
  } catch (error) {
    debug('Error trying to spawn chrome:', error)

    throw new Error('Unable to start Chrome. If you have the DEBUG env variable set,' +
        'there will be more in the logs.')
  }

  const launchTime = Date.now() - launchStartTime

  debug(`It took ${launchTime}ms to spawn chrome.`)

  return puppeteerInstance
}
