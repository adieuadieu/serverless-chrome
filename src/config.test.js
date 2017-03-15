import test from 'ava'
import config from './config'

const {
  uuid,
  handler,
} = config

test('uuid should be configured', (t) => {
  t.truthy(uuid)
  t.not(uuid.length, 0)
})

test('handler should be configured', (t) => {
  t.truthy(handler)
  t.not(handler.length, 0)
})

test('handler should be a valid function', (t) => {
  t.is(typeof handler, 'function')
})
