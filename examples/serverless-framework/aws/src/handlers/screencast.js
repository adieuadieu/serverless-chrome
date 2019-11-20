// EXPERIMENTAL

/*
@todo: time the duration between screenshot frames, and create ffmpeg video
  based on duration between framesCaptured
  see: https://github.com/peterc/chrome2gif/blob/master/index.js#L34
*/

import fs from 'fs'
import path from 'path'
import { spawn, execSync } from 'child_process'
import Cdp from 'chrome-remote-interface'
import log from '../utils/log'
import sleep from '../utils/sleep'

const defaultOptions = {
  captureFrameRate: 1,
  captureQuality: 50,
  videoFrameRate: '5',
  videoFrameSize: '848x640',
}

const FFMPEG_PATH = path.resolve('./ffmpeg')

function cleanPrintOptionValue (type, value) {
  const types = { string: String, number: Number, boolean: Boolean }
  return value ? new types[type](value) : undefined
}

function makePrintOptions (options = {}) {
  return Object.entries(options).reduce(
    (printOptions, [option, value]) => ({
      ...printOptions,
      [option]: cleanPrintOptionValue(typeof defaultOptions[option], value),
    }),
    defaultOptions
  )
}

export async function makeVideo (url, options = {}, invokeid = '') {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 20
  let result
  let loaded = false
  let framesCaptured = 0

  // @TODO: write a better queue, which waits a few seconds when reaching 0
  // before emitting "empty"
  const requestQueue = []

  const loading = async (startTime = Date.now()) => {
    log('Request queue size:', requestQueue.length, requestQueue)

    if ((!loaded || requestQueue.length > 0) && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }

  const tab = await Cdp.New()
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const {
    Network, Page, Input, DOM,
  } = client

  Network.requestWillBeSent((data) => {
    // only add requestIds which aren't already in the queue
    // why? if a request to http gets redirected to https, requestId remains the same
    if (!requestQueue.find(item => item === data.requestId)) {
      requestQueue.push(data.requestId)
    }

    log('Chrome is sending request for:', data.requestId, data.request.url)
  })

  Network.responseReceived(async (data) => {
    // @TODO: handle this better. sometimes images, fonts, etc aren't done
    // loading before we think loading is finished
    // is there a better way to detect this? see if there's any pending js
    // being executed? paints? something?
    await sleep(100) // wait here, in case this resource has triggered more resources to load.
    requestQueue.splice(requestQueue.findIndex(item => item === data.requestId), 1)
    log('Chrome received response for:', data.requestId, data.response.url)
  })

  // @TODO: check for/catch error/failures to load a resource
  // Network.loadingFailed
  // Network.loadingFinished
  // @TODO: check for results from cache, which don't trigger responseReceived
  // (Network.requestServedFromCache instead)
  // - if the request is cached you will get a "requestServedFromCache" event instead
  // of "responseReceived" (and no "loadingFinished" event)
  Page.loadEventFired((data) => {
    loaded = true
    log('Page.loadEventFired', data)
  })

  Page.domContentEventFired((data) => {
    log('Page.domContentEventFired', data)
  })

  Page.screencastFrame(({ sessionId, data, metadata }) => {
    const filename = `/tmp/frame-${invokeid}-${String(metadata.timestamp).replace('.', '')}.jpg`
    framesCaptured += 1

    // log('Received screencast frame', sessionId, metadata)
    Page.screencastFrameAck({ sessionId })

    fs.writeFile(filename, data, { encoding: 'base64' }, (error) => {
      log('Page.screencastFrame writeFile:', filename, error)
    })
  })

  if (process.env.LOGGING === 'TRUE') {
    Cdp.Version((err, info) => {
      console.log('CDP version info', err, info)
    })
  }

  try {
    await Promise.all([Network.enable(), Page.enable(), DOM.enable()])

    const interactionStartTime = Date.now()

    await client.send('Overlay.enable') // this has to happen after DOM.enable()
    await client.send('Overlay.setShowFPSCounter', { show: true })

    await Page.startScreencast({
      format: 'jpeg',
      quality: options.captureQuality,
      everyNthFrame: options.captureFrameRate,
    })

    await Page.navigate({ url })
    await loading()
    await sleep(2000)
    await Input.synthesizeScrollGesture({ x: 50, y: 50, yDistance: -2000 })
    await sleep(1000)

    await Page.stopScreencast()

    log('We think the page has finished doing what it do. Rendering video.')
    log(`Interaction took ${Date.now() - interactionStartTime}ms to finish.`)
  } catch (error) {
    console.error(error)
  }

  // @TODO: handle this better —
  // If you don't close the tab, an a subsequent Page.navigate() is unable to load the url,
  // you'll end up printing a PDF of whatever was loaded in the tab previously
  // (e.g. a previous URL) _unless_ you Cdp.New() each time. But still good to close to
  // clear up memory in Chrome
  try {
    log('trying to close tab', tab)
    await Cdp.Close({ id: tab.id })
  } catch (error) {
    log('unable to close tab', tab, error)
  }

  await client.close()

  const renderVideo = async () => {
    await new Promise((resolve, reject) => {
      const args = [
        '-y',
        '-loglevel',
        'warning', // 'debug',
        '-f',
        'image2',
        '-framerate',
        `${options.videoFrameRate}`,
        '-pattern_type',
        'glob',
        '-i',
        `"/tmp/frame-${invokeid}-*.jpg"`,
        // '-r',
        '-s',
        `${options.videoFrameSize}`,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '/tmp/video.mp4',
      ]

      log('spawning ffmpeg with args', FFMPEG_PATH, args.join(' '))

      const ffmpeg = spawn(FFMPEG_PATH, args, { cwd: '/tmp', shell: true })
      ffmpeg.on('message', msg => log('ffmpeg message', msg))
      ffmpeg.on('error', msg => log('ffmpeg error', msg) && reject(msg))
      ffmpeg.on('close', (status) => {
        if (status !== 0) {
          log('ffmpeg closed with status', status)
          return reject(new Error(`ffmpeg closed with status ${status}`))
        }

        return resolve()
      })

      ffmpeg.stdout.on('data', (data) => {
        log(`ffmpeg stdout: ${data}`)
      })

      ffmpeg.stderr.on('data', (data) => {
        log(`ffmpeg stderr: ${data}`)
      })
    })

    // @TODO: no sync-y syncface sync
    return fs.readFileSync('/tmp/video.mp4', { encoding: 'base64' })
  }

  try {
    const renderStartTime = Date.now()
    result = await renderVideo()
    log(`FFmpeg took ${Date.now() - renderStartTime}ms to finish.`)
  } catch (error) {
    console.error('Error making video', error)
  }

  // @TODO: this clean up .. do it better. and not sync
  // clean up old frames
  console.log('rm', execSync('rm -Rf /tmp/frame-*').toString())
  console.log('rm', execSync('rm -Rf /tmp/video*').toString())

  return { data: result, framesCaptured }
}

export default async function handler (event, { invokeid }, callback) {
  const queryStringParameters = event.queryStringParameters || {}
  const { url, ...printParameters } = queryStringParameters
  const options = makePrintOptions(printParameters)
  let result = {}

  log('Processing PDFification for', url, options)

  const startTime = Date.now()

  try {
    result = await makeVideo(url, options, invokeid)
  } catch (error) {
    console.error('Error printing pdf for', url, error)
    return callback(error)
  }

  // TODO: probably better to write the pdf to S3,
  // but that's a bit more complicated for this example.
  return callback(null, {
    statusCode: 200,
    // it's not possible to send binary via AWS API Gateway as it expects JSON response from Lambda
    body: `
      <html>
        <body>
          <p><a href="${url}">${url}</a></p>
          <p><code>${JSON.stringify(options, null, 2)}</code></p>
          <p>It took Chromium & FFmpeg ${Date.now() -
            startTime}ms to load URL, interact with the age and render video. Captured ${result.framesCaptured} frames.</p>
          <embed src="data:video/mp4;base64,${result.data}" width="100%" height="80%" type='video/mp4'>
        </body>
      </html>
    `,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
