import path from 'path'
import { spawn, exec } from 'child_process'
import Cdp from 'chrome-remote-interface'
import { sleep } from './utils'

const LOAD_TIMEOUT = 1000 * 60 // Give the page max 60 seconds to load
const CHROME_PATH = path.resolve(process.env.CHROME_PATH)

export default (async function navigateToPageAndPrintToPDF (url) {
  let chromeProcess

  if (CHROME_PATH) {
    console.log('chrome headless bin path', CHROME_PATH)

    chromeProcess = await new Promise((resolve, reject) => {
      const child = spawn(CHROME_PATH, ['--no-sandbox', '--remote-debugging-port=9222', '--window-size=1280x1696'])

      child.on('error', (error) => {
        console.log('Failed to start child process.', error)
        reject(error)
      })

      child.stdout.on('data', (data) => {
        console.log(`child stdout: ${data}`)
        resolve()
      })

      child.stderr.on('data', (data) => {
        console.log(`child stderr: ${data}`)
        resolve()
      })

      child.on('close', (code) => {
        if (code !== 0) {
          console.log(`child process exited with code ${code}`)
        }
      })
    })
  }

  let result
  let loaded = false

  const loading = async (startTime = Date.now()) => {
    if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }

  const tab = await Cdp.New()
  const client = await Cdp({ tab /* remote: true*/ })
  const { Network, Page } = client

  Network.requestWillBeSent((params) => {
    console.log(params.request.url)
  })

  Page.loadEventFired(() => {
    loaded = true
  })

  try {
    await Network.enable()
    await Page.enable()
    await Page.navigate({ url })
    await loading()
    const { data: screenshot } = await Page.captureScreenshot()

    result = new Buffer(screenshot, 'base64')
    // const { data: pdf } = await Page.printToPDF()

    await client.close()
  } catch (err) {
    console.error(err)
    client.close()
  }

  if (chromeProcess) chrome_process.kill()

  return result
});
