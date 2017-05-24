import os from 'os'
import path from 'path'
import sp from 'child_process' // TODO: why is this sp and not cp? (cp is also confusing cuz copy)
import Cdp from 'chrome-remote-interface'
import got from 'got'
import config from './config'
import { log, psLookup, psKill, sleep } from './utils'

const CHROME_PATH = process.env.CHROME_PATH && path.resolve(process.env.CHROME_PATH)
const HEADLESS_URL = 'http://127.0.0.1:9222'
const PROCESS_STARTUP_TIMEOUT = 1000 * 5

const LOGGING_FLAGS = config.logging ? ['--enable-logging', '--log-level=0', '--v=99'] : []

export async function isChromeRunning () {
  let running = false

  if (config.logging) {
    try {
      log('CDP List:', await Cdp.List())
    } catch (error) {
      log('no running chrome yet?')
    }
  }

  try {
    await got(`${HEADLESS_URL}/json`, { retries: 0, timeout: 50 })
    running = true
  } catch (error) {
    running = false
  }

  /* this seems to be unreliable, especially if the process has zombied
  try {
    const matches = await psLookup({ psargs: ['lx'], command: 'headless_shell' })
    running = !!matches.length
  } catch (error) {
    running = false
  }
  */

  return running
}

// TODO: refactor this cuz there's some dumb dumb in here. specifically parentResolve.
// TODO: add unit test case for when chrome fails to start for whatever reason. catch/reject.
function waitUntilProcessIsReady (startTime = Date.now(), parentResolve = () => {}) {
  return new Promise(async (resolve, reject) => {
    if (Date.now() - startTime < PROCESS_STARTUP_TIMEOUT) {
      await got(`${HEADLESS_URL}/json` /* { retries: 0, timeout: 1000 }*/)
        .then(() => {
          resolve()
          parentResolve()
        })
        .catch(async () => {
          await sleep(100)
          await waitUntilProcessIsReady(startTime, resolve)
        })
    } else {
      log('Failed to start Chrome. Chrome startup timeout exceeded.')

      resolve()
    }
  })
}

export async function spawn () {
  log('CHROME_PATH', CHROME_PATH)

  log('\n$ ls /tmp\n', sp.execSync('ls -lhtra /tmp').toString())
  log('\n$ ps lx\n', sp.execSync('ps lx').toString())
  // log('\n$ mkdir -p /tmp/chrome\n', sp.execSync('mkdir -p /tmp/chrome').toString())
  // log('\n$ chmod 4755 /tmp/chrome\n', sp.execSync('chmod 4755 /tmp/chrome').toString())
  // log('\n$ ls /tmp/chrome\n', sp.execSync('ls -lhtra /tmp/chrome').toString())
  // log('\n$ whoami\n', sp.execSync('whoami').toString())

  if (CHROME_PATH) {
    // TODO: add a timeout for reject() in case, for whatever reason, chrome doesn't start after a certain period
    return new Promise(async (resolve, reject) => {
      const isRunning = await isChromeRunning()
      log('Is Chrome already running?', isRunning)

      if (isRunning) {
        return resolve()
      }

      const flags = [...LOGGING_FLAGS, ...config.chromeFlags, '--remote-debugging-port=9222']

      log('Spawning headless shell with: ', CHROME_PATH, flags.join(' '))

      const chrome = sp.spawn(CHROME_PATH, flags, {
        cwd: os.tmpdir(),
        env: {
          CHROME_DEVEL_SANDBOX: '/tmp/chrome',
        },
        shell: true,
        detached: true,
        stdio: 'ignore',
      })

      /*
      chrome.on('error', (error) => {
        log('Failed to start chrome process.', error)
        reject()
      })

      chrome.stdout.on('data', (data) => {
        log(`chrome stdout: ${data}`)
      })

      chrome.stderr.on('data', (data) => {
        log(`chrome stderr: ${data}`)
      })
      */

      chrome.unref()

      return waitUntilProcessIsReady(Date.now(), resolve)
    })
  }

  throw new Error('CHROME_PATH is undefined.')
}

export async function kill () {
  const isRunning = await isChromeRunning()

  if (isRunning) await psKill({ command: 'headless_shell' })
}
