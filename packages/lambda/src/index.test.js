import test from 'ava'
import * as chromeFinder from 'chrome-launcher/chrome-finder'
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
  const chrome = launch({ flags: DEFAULT_TEST_FLAGS, port: 9220 })

  t.notThrows(chrome)

  const instance = await chrome

  t.truthy(instance.pid, 'pid should be set')
  t.truthy(instance.port, 'port should be set')
  t.is(instance.port, 9220, 'port should be 9220')

  instance.kill()
})

test.serial('Chrome should launch using LambdaChromeLauncher', async (t) => {
  const chromePath = await getLocalChromePath()
  const chrome = launch({
    flags: DEFAULT_TEST_FLAGS,
    chromePath,
    port: 9221,
    forceLambdaLauncher: true,
  })

  t.notThrows(chrome)

  const instance = await chrome

  t.truthy(instance.pid, 'pid should be set')
  t.truthy(instance.port, 'port should be set')
  t.is(instance.port, 9221, 'port should be 9221')

  instance.kill()
})

test.serial('Launcher should not fail if no options passed', async (t) => {
  const chrome = launch()

  t.notThrows(chrome)

  const instance = await chrome

  t.truthy(instance.pid, 'pid should be set')
  t.truthy(instance.port, 'port should be set')

  instance.kill()
})
