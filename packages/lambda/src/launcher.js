/*
  Large portion of this is inspired by/taken from Lighthouse/chrome-launcher.
  It is Copyright Google Inc, licensed under Apache License, Version 2.0.
  https://github.com/GoogleChrome/lighthouse/blob/master/chrome-launcher/chrome-launcher.ts

  We ship a modified version because the original verion comes with too
  many dependencies which complicates packaging of serverless services.
*/

import path from 'path'
import fs from 'fs'
import { execSync, spawn } from 'child_process'
import net from 'net'
import http from 'http'
import { delay, debug, makeTempDir, clearConnection } from './utils'
import DEFAULT_CHROME_FLAGS from './flags'

const CHROME_PATH = path.resolve(__dirname, './headless-chromium')

export default class Launcher {
  constructor (options = {}) {
    const {
      chromePath = CHROME_PATH,
      chromeFlags = [],
      startingUrl = 'about:blank',
      port = 0,
    } = options

    this.tmpDirandPidFileReady = false
    this.pollInterval = 500
    this.pidFile = ''
    this.startingUrl = 'about:blank'
    this.outFile = null
    this.errFile = null
    this.chromePath = CHROME_PATH
    this.chromeFlags = []
    this.requestedPort = 0
    this.userDataDir = ''
    this.port = 9222
    this.pid = null
    this.chrome = undefined

    this.options = options
    this.startingUrl = startingUrl
    this.chromeFlags = chromeFlags
    this.chromePath = chromePath
    this.requestedPort = port
  }

  get flags () {
    return [
      ...DEFAULT_CHROME_FLAGS,
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      '--disable-setuid-sandbox',
      ...this.chromeFlags,
      this.startingUrl,
    ]
  }

  prepare () {
    this.userDataDir = this.options.userDataDir || makeTempDir()
    this.outFile = fs.openSync(`${this.userDataDir}/chrome-out.log`, 'a')
    this.errFile = fs.openSync(`${this.userDataDir}/chrome-err.log`, 'a')
    this.pidFile = '/tmp/chrome.pid'
    this.tmpDirandPidFileReady = true
  }

  // resolves if ready, rejects otherwise
  isReady () {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.port)

      client.once('error', (error) => {
        clearConnection(client)
        reject(error)
      })

      client.once('connect', () => {
        clearConnection(client)
        resolve()
      })
    })
  }

  // resolves when debugger is ready, rejects after 10 polls
  waitUntilReady () {
    const launcher = this

    return new Promise((resolve, reject) => {
      let retries = 0;
      (function poll () {
        debug('Waiting for Chrome', retries)

        launcher
          .isReady()
          .then(() => {
            debug('Started Chrome')
            resolve()
          })
          .catch((error) => {
            retries += 1

            if (retries > 10) {
              return reject(error)
            }

            return delay(launcher.pollInterval).then(poll)
          })
      }())
    })
  }

  // resolves when chrome is killed, rejects  after 10 polls
  waitUntilKilled () {
    return Promise.all([
      new Promise((resolve, reject) => {
        let retries = 0
        const server = http.createServer()

        server.once('listening', () => {
          debug('Confirmed Chrome killed')
          server.close(resolve)
        })

        server.on('error', () => {
          retries += 1

          debug('Waiting for Chrome to terminate..', retries)

          if (retries > 10) {
            reject(new Error('Chrome is still running after 10 retries'))
          }

          setTimeout(() => {
            server.listen(this.port)
          }, this.pollInterval)
        })

        server.listen(this.port)
      }),
      new Promise((resolve) => {
        this.chrome.on('close', resolve)
      }),
    ])
  }

  async spawn () {
    const spawnPromise = new Promise(async (resolve) => {
      if (this.chrome) {
        debug(`Chrome already running with pid ${this.chrome.pid}.`)
        return resolve(this.chrome.pid)
      }

      const chrome = spawn(this.chromePath, this.flags, {
        detached: true,
        stdio: ['ignore', this.outFile, this.errFile],
      })

      this.chrome = chrome

      // unref the chrome instance, otherwise the lambda process won't end correctly
      if (chrome.chrome) {
        chrome.chrome.removeAllListeners()
        chrome.chrome.unref()
      }

      fs.writeFileSync(this.pidFile, chrome.pid.toString())

      debug(
        'Launcher',
        `Chrome running with pid ${chrome.pid} on port ${this.port}.`
      )

      return resolve(chrome.pid)
    })

    const pid = await spawnPromise
    await this.waitUntilReady()
    return pid
  }

  async launch () {
    if (this.requestedPort !== 0) {
      this.port = this.requestedPort

      // If an explict port is passed first look for an open connection...
      try {
        return await this.isReady()
      } catch (err) {
        debug(
          'ChromeLauncher',
          `No debugging port found on port ${
            this.port
          }, launching a new Chrome.`
        )
      }
    }

    if (!this.tmpDirandPidFileReady) {
      this.prepare()
    }

    this.pid = await this.spawn()
    return Promise.resolve()
  }

  kill () {
    return new Promise(async (resolve, reject) => {
      if (this.chrome) {
        debug('Trying to terminate Chrome instance')

        try {
          process.kill(-this.chrome.pid)

          debug('Waiting for Chrome to terminate..')
          await this.waitUntilKilled()
          debug('Chrome successfully terminated.')

          this.destroyTemp()

          delete this.chrome
          return resolve()
        } catch (error) {
          debug('Chrome could not be killed', error)
          return reject(error)
        }
      } else {
        // fail silently as we did not start chrome
        return resolve()
      }
    })
  }

  destroyTemp () {
    return new Promise((resolve) => {
      // Only clean up the tmp dir if we created it.
      if (
        this.userDataDir === undefined ||
        this.options.userDataDir !== undefined
      ) {
        return resolve()
      }

      if (this.outFile) {
        fs.closeSync(this.outFile)
        delete this.outFile
      }

      if (this.errFile) {
        fs.closeSync(this.errFile)
        delete this.errFile
      }

      return execSync(`rm -Rf ${this.userDataDir}`, resolve)
    })
  }
}
