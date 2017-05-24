import os from 'os'
import path from 'path'
import sp from 'child_process' // TODO: why is this sp and not cp? (cp is also confusing cuz copy)
import got from 'got'
import config from './config'
import { log, psLookup, psKill, sleep } from './utils'

const CHROME_PATH = process.env.CHROME_PATH && path.resolve(process.env.CHROME_PATH)
const HEADLESS_URL = 'http://127.0.0.1:9222'
const PROCESS_STARTUP_TIMEOUT = 1000 * 5

const LOGGING_FLAGS = config.logging ? ['--enable-logging', '--log-level=0', '--v=99'] : []

export default async function spawn () {
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
