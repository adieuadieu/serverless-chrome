import Cdp from 'chrome-remote-interface'
import config from '../config'
import { log, sleep } from '../utils'

export async function printUrlToPdf (url) {
  const LOAD_TIMEOUT = (config && config.chrome.pageLoadTimeout) || 1000 * 60

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

  if (config.logging) {
    Cdp.Version((err, info) => {
      console.log('CDP version info', err, info)
    })
  }

  try {
    await Promise.all([
      Network.enable(), // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Network/#method-enable
      Page.enable(), // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-enable
    ])

    await Page.navigate({ url }) // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-navigate
    await loading()

    // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-printToPDF
    const pdf = await Page.printToPDF({
      printBackgrounds: true,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      paperType: 'A4',
    })
    result = pdf.data
  } catch (error) {
    console.error(error)
  }

  /* try {
    log('trying to close tab', tab)
    await Cdp.Close({ id: tab })
  } catch (error) {
    log('unable to close tab', tab, error)
  }*/

  await client.close()

  return result
}

export default (async function printToPdfHandler (event) {
  const { queryStringParameters: { url } } = event
  let pdf

  log('Processing PDFification for', url)

  try {
    pdf = await printUrlToPdf(url)
  } catch (error) {
    console.error('Error printing pdf for', url, error)
    throw new Error('Unable to print pdf')
  }

  // TODO: probably better to write the pdf to S3,
  // but that's a bit more complicated for this example.
  return {
    statusCode: 200,
    // it's not possible to send binary via AWS API Gateway as it expects JSON response from Lambda
    body: `
      <html>
        <body>
          <embed src="data:application/pdf;base64,${pdf}" width="100%" height="100%" type='application/pdf'>
        </body>
      </html>
    `,
    headers: {
      'Content-Type': 'text/html',
    },
  }
})
