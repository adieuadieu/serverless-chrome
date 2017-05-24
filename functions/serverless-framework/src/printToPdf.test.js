import test from 'ava'
import printToPdfHandler, { printUrlToPdf } from './printToPdf'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}

test('printToPdf handler', async (t) => {
  const promise = printToPdfHandler(testEvent, {})

  t.notThrows(promise)

  const result = await promise

  t.is(result.statusCode, 200)
})

/*
test('printToPdf handler should throw an error when not provided with a valid URL',
async (t) => {
  const promise = printToPdfHandler({})

  t.throws(promise)

  await promise
})
*/

test('printUrlToPdf() should return base64 encoded application/pdf', async (t) => {
  const promise = printUrlToPdf(testUrl)

  t.notThrows(promise)

  const result = await promise

  t.is(typeof result, 'string')
  // TODO: any more assertions we can make here to be assured that we got an actual image?
})
