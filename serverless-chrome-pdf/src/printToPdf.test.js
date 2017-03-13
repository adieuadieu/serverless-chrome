import test from 'ava'
import printToPdf from './printToPdf'

const testUrl = 'https://github.com/adieuadieu'

test.skip('printToPdf()', async (t) => {
  const promise = printToPdf(testUrl)
  t.notThrows(promise)

  const result = await promise
  t.true(result instanceof Buffer, 'expected a buffer')
})
