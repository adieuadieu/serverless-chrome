import test from 'ava'
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder'
import launch from './index'

const DEFAULT_TEST_FLAGS = ['--headless']

async function getLocalChromePath () {
  const installations = await chromeFinder[process.platform]()

  if (installations.length === 0) {
    throw new Error('No Chrome Installations Found')
  }

  return installations[0]
}

test.serial('Chrome should launch using LocalChromeLauncher', async (t) => {
  const chromePath = await getLocalChromePath()
  const chrome = launch({
    flags: DEFAULT_TEST_FLAGS,
    chromePath,
    port: 9220,
  })

  t.notThrows(chrome)

  const instance = await chrome

  t.truthy(instance.pid, 'pid should be set')
  t.truthy(instance.port, 'port should be set')
  t.is(instance.port, 9220, 'port should be 9220')

  instance.kill()
})

// Covered by the integration-test.
test('Chrome should launch using LambdaChromeLauncher', (t) => {
  // @TODO: proper test..
  t.pass()
})
