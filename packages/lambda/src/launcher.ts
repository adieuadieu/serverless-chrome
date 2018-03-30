/*
  Large portion of this is inspired by/taken from Lighthouse/chrome-launcher.
  It is Copyright Google Inc, licensed under Apache License, Version 2.0.
  https://github.com/GoogleChrome/lighthouse/blob/master/chrome-launcher/chrome-launcher.ts

  We ship a modified version because the original verion comes with too
  many dependencies which complicates packaging of serverless services.
*/

import path from 'path'
import fs from 'fs'
import { execFile, spawn, ChildProcess } from 'child_process'
import net from 'net'
import http from 'http'
import { delay, debug, makeTempDir, clearConnection } from './utils'
import DEFAULT_CHROME_FLAGS from './flags'

const CHROME_PATH = path.resolve(__dirname, './headless-chromium')

export interface IOptions {
  chromePath?: string
  chromeFlags?: string[]
  startingUrl?: string
  port?: number
  userDataDir?: string
}

export default class Launcher {
  private pollInterval: number = 500
  private pidFile = ''
  private tmpDirandPidFileReady = false
  private startingUrl = 'about:blank'
  private outFile: null | number = null
  private errFile: null | number = null
  private chromePath = CHROME_PATH
  private chromeFlags: string[] = []
  private requestedPort = 0
  private userDataDir = ''
  private port = 9222
  private chrome: ChildProcess | undefined = undefined

  constructor (private options: IOptions = {}) {
    const {
      chromePath = CHROME_PATH,
      chromeFlags = [],
      startingUrl = 'about:blank',
      port = 0,
    } = options

    this.startingUrl = startingUrl
    this.chromeFlags = chromeFlags
    this.chromePath = chromePath
    this.requestedPort = port
  }

  private get flags () {
    return [
      ...DEFAULT_CHROME_FLAGS,
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.userDataDir}`,
      '--disable-setuid-sandbox',
      ...this.chromeFlags,
      this.startingUrl,
    ]
  }

  private prepare () {
    this.userDataDir = this.options.userDataDir || makeTempDir()
    this.outFile = fs.openSync(`${this.userDataDir}/chrome-out.log`, 'a')
    this.errFile = fs.openSync(`${this.userDataDir}/chrome-err.log`, 'a')
    this.pidFile = '/tmp/chrome.pid'
    this.tmpDirandPidFileReady = true
  }

  // resolves if ready, rejects otherwise
  private isReady () {
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
  private waitUntilReady () {
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
  private waitUntilKilled (chrome: ChildProcess) {
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
        chrome.on('close', resolve)
      }),
    ])
  }

  private async spawn () {
    const spawnPromise = new Promise<number>(async (resolve) => {
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
      // i'm not sure what is this for, and it makes typescript error
      // @ts-ignore
      if (chrome.chrome) {
        // @ts-ignore
        chrome.chrome.removeAllListeners()
        // @ts-ignore
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

  public async launch () {
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

    await this.spawn()
    return Promise.resolve()
  }

  public kill () {
    return new Promise(async (resolve, reject) => {
      if (this.chrome) {
        debug('Trying to terminate Chrome instance')

        try {
          process.kill(-this.chrome.pid)

          debug('Waiting for Chrome to terminate..')
          await this.waitUntilKilled(this.chrome)
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

  private destroyTemp () {
    return new Promise<void>((resolve) => {
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

      return execFile('rm', ['-Rf', `${this.userDataDir}`], {}, () => resolve())
    })
  }
}
