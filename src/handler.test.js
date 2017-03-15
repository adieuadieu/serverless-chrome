import test from 'ava'
import { run } from './handler'
import captureScreenshotHandler from './handlers/captureScreenshot'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}
const testContext = {}

test('run() with captureScreenshot handler', async (t) => {
  const promise = run(
    testEvent,
    testContext,
    (error, response) => {
      t.falsy(error)
      t.truthy(response.body)
      t.is(response.statusCode, 200)
    },
    captureScreenshotHandler,
  )

  t.notThrows(promise)

  await promise
})
