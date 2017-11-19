import test from 'ava'
import pdf from './pdf'

const testUrl = 'https://github.com/adieuadieu'

test('printUrlToPdf() should return base64 encoded application/pdf', async (t) => {
  await t.notThrows(async () => {
    const result = await pdf(testUrl)

    t.is(typeof result, 'string')
  })
})
