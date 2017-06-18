import test from 'ava'
import captureScreenshotHandler, { captureScreenshotOfUrl } from './captureScreenshot'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}

test('captureScreenshot handler', async (t) => {
  const promise = captureScreenshotHandler(testEvent, {})

  t.notThrows(promise)

  const result = await promise

  t.is(result.statusCode, 200)
})

/*
test('captureScreenshot handler should throw an error when not provided with a valid URL',
async (t) => {
  const promise = captureScreenshotHandler({})

  t.throws(promise)

  await promise
})
*/

test('captureScreenshotOfUrl() should return base64 encoded image/png', async (t) => {
  const promise = captureScreenshotOfUrl(testUrl)

  t.notThrows(promise)

  const result = await promise

  t.is(typeof result, 'string')
  // TODO: any more assertions we can make here to be assured that we got an actual image?
})
