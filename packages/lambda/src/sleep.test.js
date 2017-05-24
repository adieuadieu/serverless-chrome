import test from 'ava'
import sleep from './sleep'

// TODO
test.skip('sleep()', async (t) => {
  const promise = sleep(1000)

  t.notThrows(promise)

  const result = await promise
})
