import Cdp from 'chrome-remote-interface'
import config from '../config'
import { log, sleep } from '../utils'

export async function captureScreenshotOfUrl (url) {
  const LOAD_TIMEOUT = (config && config.chrome.pageLoadTimeout) || 1000 * 30

  let result
  let loaded = false

  const loading = async (startTime = Date.now()) => {
    if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }

  const tab = await Cdp.New({ host: '127.0.0.1' })
  const client = await Cdp({ host: '127.0.0.1', tab })

  const { Network, Page } = client

  Network.requestWillBeSent((params) => {
    log('Chrome is sending request for:', params.request.url)
  })

  Page.loadEventFired(() => {
    loaded = true
  })

  try {
    await Network.enable()
    await Page.enable()
    await Page.navigate({ url })
    await loading()
    const screenshot = await Page.captureScreenshot()
    result = screenshot.data
  } catch (error) {
    console.error(error)
  }

  await client.close()

  return result
}

export default (async function captureScreenshotHandler (event) {
  const { queryStringParameters: { url } } = event
  let screenshot

  log('Processing screenshot capture for', url)

  try {
    screenshot = await captureScreenshotOfUrl(url)
  } catch (error) {
    console.error('Error capturing screenshot for', url, error)
    throw new Error('Unable to capture screenshot')
  }

  return {
    statusCode: 200,
    // it's not possible to send binary via AWS API Gateway as it expects JSON response from Lambda
    body: `<html><body><img src="data:image/png;base64,${screenshot}" /></body></html>`,
    headers: {
      'Content-Type': 'text/html',
    },
  }
});
