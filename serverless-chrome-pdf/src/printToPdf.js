import { spawn } from 'child_process'
import fs from 'fs'
import chrome from 'chrome-remote-interface'

const CHROME_PATH = process.env.CHROME_PATH

export default (async function navigateToPageAndPrintToPDF (url) {
  if (CHROME_PATH) spawn(CHROME_PATH, ['--no-sandbox', '--remote-debugging-port=9222', '--window-size=1280x1696'])

  chrome(async (client) => {
    // extract domains
    const { Network, Page } = client
    // setup handlers
    Network.requestWillBeSent((params) => {
      console.log(params.request.url)
    })
    Page.loadEventFired(() => {
      client.close()
    })
    // enable events then start!
    try {
      await Network.enable()
      await Page.enable()
      const result = await Page.navigate({ url })
      console.log(result)

      Page.captureScreenshot().then((v) => {
        fs.writeFileSync('test.png', v.data, 'base64')
      })
    } catch (err) {
      console.error(err)
      client.close()
    }
  }).on('error', (error) => {
    console.error(error)
    throw error
  })
});
