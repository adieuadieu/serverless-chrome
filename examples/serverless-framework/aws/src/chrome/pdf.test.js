import test from 'ava'
import handler from '../handlers/pdf'
import pdf from './pdf'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}

test('PDF handler', async (t) => {
  const promise = handler(testEvent, {})

  t.notThrows(promise)

  const result = await promise

  t.is(result.statusCode, 200)
})

test('PDF handler should throw an error when not provided with a valid URL', async (t) => {
  const promise = handler({})

  t.throws(promise)

  await promise
})

test('printUrlToPdf() should return base64 encoded application/pdf', async (t) => {
  const promise = pdf(testUrl)

  t.notThrows(promise)

  const result = await promise

  t.is(typeof result, 'string')
  // TODO: any more assertions we can make here to be assured that we got an actual image?
})
