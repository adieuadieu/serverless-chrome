import Cdp from 'chrome-remote-interface'
import log from '../utils/log'
import sleep from '../utils/sleep'

export default async function captureScreenshotOfUrl (url) {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 60

  let result
  let loaded = false

  const loading = async (startTime = Date.now()) => {
    if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }

  const [tab] = await Cdp.List()
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const { Network, Page } = client

  Network.requestWillBeSent((params) => {
    log('Chrome is sending request for:', params.request.url)
  })

  Page.loadEventFired(() => {
    loaded = true
  })

  try {
    await Promise.all([Network.enable(), Page.enable()])

    await Page.navigate({ url })
    await Page.loadEventFired()
    await loading()

    // TODO: resize the chrome "window" so we capture the full height of the page
    // document.body.scrollHeight
    // setviewport: with option to set mobile mode
    const screenshot = await Page.captureScreenshot({ format: 'png', fromSurface: true })

    result = screenshot.data
  } catch (error) {
    console.error(error)
  }

  await client.close()

  return result
}
