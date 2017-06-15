//
//
// HEY! Be sure to re-incorporate changes from @albinekb
// https://github.com/adieuadieu/serverless-chrome/commit/fca8328134f1098adf92e115f69002e69df24238
//
//
//
import Cdp from 'chrome-remote-interface'
import config from '../config'
import { log, sleep } from '../utils'

const defaultPrintOptions = {
  landscape: false,
  displayHeaderFooter: false,
  printBackground: true,
  scale: 1,
  paperWidth: 8.27, // aka A4
  paperHeight: 11.69, // aka A4
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  pageRanges: '',
}

function cleanPrintOptionValue (type, value) {
  const types = { string: String, number: Number, boolean: Boolean }
  return types[type](value)
}

function makePrintOptions (options = {}) {
  return Object.entries(options).reduce(
    (printOptions, [option, value]) => ({
      ...printOptions,
      [option]: cleanPrintOptionValue(typeof defaultPrintOptions[option], value),
    }),
    defaultPrintOptions
  )
}

export async function printUrlToPdf (url, printOptions = {}) {
  const LOAD_TIMEOUT = (config && config.chrome.pageLoadTimeout) || 1000 * 20
  let result
  let loaded = false
  const requestQueue = [] // @TODO: write a better quite, which waits a few seconds when reaching 0 before emitting "empty"

  const loading = async (startTime = Date.now()) => {
    log('Request queue size:', requestQueue.length, requestQueue)

    if ((!loaded || requestQueue.length > 0) && Date.now() - startTime < LOAD_TIMEOUT) {
      await sleep(100)
      await loading(startTime)
    }
  }

  const tab = await Cdp.New()
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const { Network, Page } = client

  Network.requestWillBeSent((data) => {
    // only add requestIds which aren't already in the queue
    // why? if a request to http gets redirected to https, requestId remains the same
    if (!requestQueue.find(item => item === data.requestId)) {
      requestQueue.push(data.requestId)
    }

    log('Chrome is sending request for:', data.requestId, data.request.url)
  })

  Network.responseReceived(async (data) => {
    // @TODO: handle this better. sometimes images, fonts, etc aren't done loading before we think loading is finished
    // is there a better way to detect this? see if there's any pending js being executed? paints? something?
    await sleep(100) // wait here, in case this resource has triggered more resources to load.
    requestQueue.splice(requestQueue.findIndex(item => item === data.requestId), 1)
    log('Chrome received response for:', data.requestId, data.response.url)
  })

  Page.loadEventFired((data) => {
    loaded = true
    log('Page.loadEventFired', data)
  })

  Page.domContentEventFired((data) => {
    log('Page.domContentEventFired', data)
  })

  if (config.logging) {
    Cdp.Version((err, info) => {
      console.log('CDP version info', err, info)
    })
  }

  try {
    await Promise.all([
      Network.enable(), // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-enable
      Page.enable(), // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-enable
    ])

    await Page.navigate({ url }) // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigate
    await loading()

    log('We think the page has finished loading. Printing PDF.')

    // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-printToPDF
    const pdf = await Page.printToPDF(printOptions)
    result = pdf.data
  } catch (error) {
    console.error(error)
  }

  // @TODO: handle this better —
  // If you don't close the tab, an a subsequent Page.navigate() is unable to load the url,
  // you'll end up printing a PDF of whatever was loaded in the tab previously (e.g. a previous URL)
  // _unless_ you Cdp.New() each time. But still good to close to clear up memory in Chrome
  try {
    log('trying to close tab', tab)
    await Cdp.Close({ id: tab.id })
  } catch (error) {
    log('unable to close tab', tab, error)
  }

  await client.close()

  return result
}

export default (async function printToPdfHandler (event) {
  const { queryStringParameters: { url, ...printParameters } } = event
  const printOptions = makePrintOptions(printParameters)
  let pdf

  log('Processing PDFification for', url, printOptions)

  const startTime = Date.now()

  try {
    pdf = await printUrlToPdf(url, printOptions)
  } catch (error) {
    console.error('Error printing pdf for', url, error)
    throw new Error('Unable to print pdf')
  }

  const endTime = Date.now()

  // TODO: probably better to write the pdf to S3,
  // but that's a bit more complicated for this example.
  return {
    statusCode: 200,
    // it's not possible to send binary via AWS API Gateway as it expects JSON response from Lambda
    body: `
      <html>
        <body>
          <p><a href="${url}">${url}</a></p>
          <p><code>${JSON.stringify(printOptions, null, 2)}</code></p>
          <p>Chromium took ${endTime - startTime} ms to load URL and render PDF.</p>
          <embed src="data:application/pdf;base64,${pdf}" width="100%" height="100%" type='application/pdf'>
        </body>
      </html>
    `,
    headers: {
      'Content-Type': 'text/html',
    },
  }
})
