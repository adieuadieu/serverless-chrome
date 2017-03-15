import test from 'ava'
import { log, psLookup, psKill, sleep } from './utils'

// TODO
test.skip('log()', async (t) => {
  const promise = sleep(1000)

  t.notThrows(promise)

  const result = await promise
})

// TODO
test.skip('psLookup()', async (t) => {
  const promise = psLookup({ command: 'node' })

  t.notThrows(promise)

  const result = await promise
})

// TODO
test.skip('psKill()', async (t) => {
  const promise = psKill()

  t.notThrows(promise)

  const result = await promise
})

// TODO
test.skip('sleep()', async (t) => {
  const promise = sleep(1000)

  t.notThrows(promise)

  const result = await promise
})
