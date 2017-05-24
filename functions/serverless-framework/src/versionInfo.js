import chrome from '@serverless-chrome/lambda'
import Cdp from 'chrome-remote-interface'
import { sleep } from './src/utils'

const LOAD_TIMEOUT = 1000 * 30

export default {
  logging: true,
  async handler(event) {
    const requestsMade = []
    let loaded = false

    const loading = async (startTime = Date.now()) => {
      if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
        await sleep(100)
        await loading(startTime)
      }
    }

    const tab = await Cdp.New({ host: '127.0.0.1' })
    const client = await Cdp({ host: '127.0.0.1', tab })

    const { Network, Page, DOM } = client

    Network.requestWillBeSent(params => requestsMade.push(params))

    Page.loadEventFired(() => {
      loaded = true
    })

    const versionInfo = await Cdp.Version()

    await client.close()

    return {
      statusCode: 200,
      body: JSON.stringify({
        versionInfo,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  },
}
