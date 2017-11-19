import test from 'ava'
import screenshot from './screenshot'

const testUrl = 'https://github.com/adieuadieu'

test('screenshot() should return base64 encoded image/png', async (t) => {
  await t.notThrows(async () => {
    const result = await screenshot(testUrl)

    t.is(typeof result, 'string')
  })
})
