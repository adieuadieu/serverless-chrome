import test from 'ava'
import { spawn, kill } from './chrome'

// TODO
test.skip('spawn()', async (t) => {
  const promise = spawn()

  t.notThrows(promise)

  const result = await promise
})

// TODO
test.skip('kill()', async (t) => {
  const promise = kill()

  t.notThrows(promise)

  const result = await promise
})

test.todo('test waitUntilProcessIsReady')
