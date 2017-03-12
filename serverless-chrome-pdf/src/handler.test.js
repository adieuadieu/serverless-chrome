import test from 'ava'
import { generatePdf } from './handler'

const testEvent = {
  queryStringParameters: { url: 'https://github.com/adieuadieu' },
}

test('generatePdf()', async (t) => {
  const promise = generatePdf(testEvent, {}, (error, response) => {
    t.falsy(error)
    console.log(response)
  })

  t.notThrows(promise)

  const result = await promise
})
