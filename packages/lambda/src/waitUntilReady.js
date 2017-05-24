import os from 'os'
import path from 'path'
import sp from 'child_process' // TODO: why is this sp and not cp? (cp is also confusing cuz copy)
import Cdp from 'chrome-remote-interface'
import got from 'got'
import config from './config'
import { log, psLookup, psKill, sleep } from './utils'

const HEADLESS_URL = 'http://127.0.0.1:9222'
const PROCESS_STARTUP_TIMEOUT = 1000 * 5

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
