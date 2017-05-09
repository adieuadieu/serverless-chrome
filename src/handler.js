import config from './config'
import { spawn as spawnChrome } from './chrome'
import { log } from './utils'

// eslint-disable-next-line import/prefer-default-export
export async function run (event, context, callback, handler = config.handler) {
  let handlerResult = {}
  let handlerError = null

  const chromeStartTime = Date.now()

  try {
    await spawnChrome()
  } catch (error) {
    console.error('Error in spawning Chrome')
    return callback(error)
  }

  log(`It took ${Date.now() - chromeStartTime}ms to spawn chrome.`)

  const handlerStartTime = Date.now()

  try {
    handlerResult = await handler(event, context)
  } catch (error) {
    console.error('Error in handler:', error)
    handlerError = error
  }

  log(`Handler took ${Date.now() - handlerStartTime}ms to return.`)
  log('Handler result:', JSON.stringify(handlerResult, null, ' '))

  return callback(handlerError, handlerResult)
}
