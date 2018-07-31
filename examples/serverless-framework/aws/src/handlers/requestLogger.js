/* eslint-disable import/prefer-default-export */
import Cdp from 'chrome-remote-interface'

const LOAD_TIMEOUT = 1000 * 30

export default async function handler (event, context, callback) {
  const queryStringParameters = event.queryStringParameters || {}
  const {
    url = 'https://github.com/adieuadieu/serverless-chrome',
  } = queryStringParameters
  const requestsMade = []

  const [tab] = await Cdp.List()
  const client = await Cdp({ host: '127.0.0.1', target: tab })

  const { Network, Page } = client

  Network.requestWillBeSent(params => requestsMade.push(params))

  const loadEventFired = Page.loadEventFired()

  // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-enable
  await Network.enable()

  // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-enable
  await Page.enable()

  // https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-navigate
  await Page.navigate({ url })

  // wait until page is done loading, or timeout
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      reject,
      LOAD_TIMEOUT,
      new Error(`Page load timed out after ${LOAD_TIMEOUT} ms.`)
    )

    loadEventFired.then(async () => {
      clearTimeout(timeout)
      resolve()
    })
  })
  // It's important that we close the websocket connection,
  // or our Lambda function will not exit properly
  await client.close()

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      requestsMade,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
