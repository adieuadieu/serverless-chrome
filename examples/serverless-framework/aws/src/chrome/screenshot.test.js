import test from 'ava'
import handler from '../handlers/screenshot'
import screenshot from './screenshot'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}

test('Screenshot handler', async (t) => {
  const promise = handler(testEvent, {})

  t.notThrows(promise)

  const result = await promise

  t.is(result.statusCode, 200)
})

test('Screenshot handler should throw an error when not provided with a valid URL', async (t) => {
  const promise = handler({})

  t.throws(promise)

  await promise
})

test('screenshot() should return base64 encoded image/png', async (t) => {
  const promise = screenshot(testUrl)

  t.notThrows(promise)

  const result = await promise

  t.is(typeof result, 'string')
  // TODO: any more assertions we can make here to be assured that we got an actual image?
})
