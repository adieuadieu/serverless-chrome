import test from 'ava'
import handler from './screenshot'

const testUrl = 'https://github.com/adieuadieu'
const testEvent = {
  queryStringParameters: { url: testUrl },
}

test('Screenshot handler', async (t) => {
  await t.notThrows(async () => {
    const result = await handler(testEvent, {})

    t.is(result.statusCode, 200)
  })
})
