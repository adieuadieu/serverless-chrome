import { log } from './utils'

import captureScreenshotOfUrl from './captureScreenshot'

export default (async function captureScreenshotBinaryHandler (event) {
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
    body: screenshot, // is in base64
    isBase64Encoded: true,
  }
})
