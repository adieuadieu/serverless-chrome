import os from 'os'
import fs from 'fs'
import path from 'path'
import { spawn, exec, execSync } from 'child_process'
import WebSocket from 'ws'
import got from 'got'
import AWS from 'aws-sdk'
import { sleep } from './utils'

export const tracelogBucket = new AWS.S3({
  params: { Bucket: process.env.S3_PDF_BUCKET },
})

const CHROME_PATH = process.env.CHROME_PATH && path.resolve(process.env.CHROME_PATH)

// const mountface = execSync('mount --bind /tmp/ /dev/shm/')
// console.log('mounted', mountface.toString())

let log = ''

let chromeProcess

if (CHROME_PATH) {
  console.log('os.tmpdir()', os.tmpdir())

  const copyface = execSync('cp -R /var/task/headless-chrome /tmp')
  console.log('copied', copyface.toString())

  console.log('LOL chrome headless bin path', CHROME_PATH)

  const blah1 = spawn('df', ['-h'])
  blah1.stdout.on('data', (data) => {
    console.log(`blah1 stdout: ${data}`)
  })

  const CHROME_EXEC = '/tmp/headless-chrome/headless_shell'
  const CHROME_ARGS = [
    // http://peter.sh/experiments/chromium-command-line-switches/
    '--headless', // Redundant?
    '--disable-gpu', // TODO: should we do this?

    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/user-data',
    '--hide-scrollbars',
    '--enable-logging',
    '--log-level=0',
    '--v=99',
    '--single-process',
    '--data-path=/tmp/data-path',

    '--ignore-certificate-errors', // Dangerous?

    '--no-zygote', // Disables the use of a zygote process for forking child processes. Instead, child processes will be forked and exec'd directly. Note that --no-sandbox should also be used together with this flag because the sandbox needs the zygote to work.

    '--homedir=/tmp',
    '--media-cache-size=0',
    '--disable-lru-snapshot-cache',
    '--disable-setuid-sandbox',
    '--disk-cache-size=0',
    '--disk-cache-dir=/tmp/cache-dir',

    '--use-simple-cache-backend',
    '--enable-low-end-device-mode',

    // '--dump-dom', // Dump DOM is disabled when remote debugging is enabled.
    // '--use-gl=""',
    // '--screenshot="/tmp/test.png"', // Capture screenshot is disabled when remote debugging is enabled.
    // '--trace-startup=*,disabled-by-default-memory-infra',
    '--trace-startup=*',
    '--trace=*',
    //'https://google.com/',
  ]

  chromeProcess = new Promise((resolve, reject) => {
    console.log('Spawning headless_shell:\n $ ', CHROME_EXEC, CHROME_ARGS.join(' '))

    const child = spawn(
      // CHROME_PATH,
      CHROME_EXEC,
      CHROME_ARGS,
      { cwd: os.tmpdir(), shell: true, detached: true },
    ) // '--window-size=1280x1696'

    child.on('error', (error) => {
      console.log('Failed to start chrome process.', error)
      reject(error)
    })

    child.stdout.on('data', (data) => {
      console.log(`chrome stdout: ${data}`)
      log += data
      resolve()
    })

    child.stderr.on('data', (data) => {
      console.log(`chrome stderr: ${data}`)
      log += data
      resolve()
    })

    child.on('close', (code) => {
      if (code !== 0) {
        console.log(`chrome process exited with code ${code}`)
      }
    })
  })
}

export async function generatePdf (event, context, callback) {
  const { queryStringParameters: { url } } = event

  await sleep(1000 * 15)

  const headless = '127.0.0.1:9222'
  const headlessUrl = `http://${headless}`
  const tab = await got(`${headlessUrl}/json/new`)
    .then(({ body }) => JSON.parse(body))
    .catch(() => null)

  console.log('new tab', tab)

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(tab.webSocketDebuggerUrl)

    console.log('opening ws to', tab.webSocketDebuggerUrl)

    ws.on('message', (data) => {
      console.log('got some data!', data)
    })

    ws.on('open', () => {
      console.log('ws open')

      let id = 0

      ws.send(JSON.stringify({ id: id++, method: 'Log.enable', params: {} }), () => {
        ws.send(
          JSON.stringify({ id: id++, method: 'Domain.Doesnt.Exist.Fake', params: {} }),
          () => {
            ws.send(JSON.stringify({ id: id++, method: 'Network.enable', params: {} }), (error) => {
              console.log('ws error?', error)

              ws.send(JSON.stringify({ id: id++, method: 'Page.enable', params: {} }), (error2) => {
                console.log('ws error?2', error2)

                ws.send(
                  JSON.stringify({ id: id++, method: 'Page.navigate', params: { url } }),
                  (error3) => {
                    console.log('ws error3?', error3)
                  },
                )
              })
            })
          },
        )
      })
    })

    ws.on('close', () => {
      console.log('ws closed')
    })

    ws.on('error', (error) => {
      console.log('some error?', error)
      reject(error)
    })

    setTimeout(resolve, 29999)
  })

  const response = {
    url,
  }

  console.log(`Completed processing event for URL ${url}`)

  console.log('full chrome log', log)

  return setTimeout(
    () => {
      console.log('almost..')

      const tmpLs = execSync('ls -lhtra /tmp')
      console.log('tmp ls', tmpLs.toString())

      if (fs.existsSync('/tmp/chrometrace.log')) {
        const key = `argh/blah/chrometrace-${Date.now()}.log`
        console.log('key', key)
        tracelogBucket
          .upload({
            Key: key,
            Body: fs.readFileSync('/tmp/chrometrace.log'),
          })
          .promise()
          .then(() => {
            response.tracelog = tracelogBucket.getSignedUrl('getObject', {
              Key: key,
              Expires: 60 * 60 * 24 * 365, // expires in 1 year
            })

            console.log('chrome trace log', response.tracelog)
            callback(null, response)
          })
          .catch(callback)
      } else {
        callback(null, response)
      }
    },
    9999,
  )
}
