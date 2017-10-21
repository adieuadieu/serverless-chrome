import { log } from './utils'

import captureScreenshotOfUrl from './captureScreenshot'

export default (async function captureScreenshotHtmlHandler (event) {
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
    body: `<html><body><img src="data:image/png;base64,${screenshot}" /></body></html>`,
    headers: {
      'Content-Type': 'text/html',
    },
  }
})
