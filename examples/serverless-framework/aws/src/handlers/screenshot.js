import log from '../utils/log'
import screenshot from '../chrome/screenshot'

export default async function handler (event, context, callback) {
  const queryStringParameters = event.queryStringParameters || {}
  const {
    url = 'https://github.com/adieuadieu/serverless-chrome',
    mobile = false,
  } = queryStringParameters

  let data

  log('Processing screenshot capture for', url)

  const startTime = Date.now()

  try {
    data = await screenshot(url, mobile)
  } catch (error) {
    console.error('Error capturing screenshot for', url, error)
    return callback(error)
  }

  log(`Chromium took ${Date.now() - startTime}ms to load URL and capture screenshot.`)

  return callback(null, {
    statusCode: 200,
    body: data,
    isBase64Encoded: true,
    headers: {
      'Content-Type': 'image/png',
    },
  })
}
