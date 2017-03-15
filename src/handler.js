import config from './config'
import { spawn as spawnChrome } from './chrome'
import { log } from './utils'

// eslint-disable-next-line import/prefer-default-export
export async function run (event, context, callback, handler = config.handler) {
  let handlerResult = {}
  let handlerError = null

  try {
    await spawnChrome()
  } catch (error) {
    console.error('Error in spawning Chrome')
    return callback(error)
  }

  try {
    handlerResult = await handler(event, context)
    log('Handler result:', handlerResult)
  } catch (error) {
    console.error('Error in handler:', error)
    handlerError = error
  }

  return callback(handlerError, handlerResult)
}
