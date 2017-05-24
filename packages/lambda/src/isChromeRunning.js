import os from 'os'
import path from 'path'
import sp from 'child_process' // TODO: why is this sp and not cp? (cp is also confusing cuz copy)
import Cdp from 'chrome-remote-interface'
import got from 'got'
import config from './config'
import { log, psLookup, psKill, sleep } from './utils'

const CHROME_PATH =
  process.env.CHROME_PATH && path.resolve(process.env.CHROME_PATH)
const HEADLESS_URL = 'http://127.0.0.1:9222'
const PROCESS_STARTUP_TIMEOUT = 1000 * 5

const LOGGING_FLAGS = config.logging
  ? ['--enable-logging', '--log-level=0', '--v=99']
  : []

export async function isChromeRunning() {
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
