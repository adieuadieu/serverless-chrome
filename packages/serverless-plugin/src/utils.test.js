import test from 'ava'
import {
  throwIfUnsupportedProvider,
  throwIfUnsupportedRuntime,
  throwIfWrongPluginOrder,
  getHandlerFileAndExportName,
} from './utils'

test('throwIfUnsupportedProvider()', (t) => {
  t.throws(() => throwIfUnsupportedProvider('bogus'), Error)
  t.notThrows(() => throwIfUnsupportedProvider('aws'))
})

test('throwIfUnsupportedRuntime()', (t) => {
  t.throws(() => throwIfUnsupportedRuntime('bogus'), Error)
  t.notThrows(() => throwIfUnsupportedRuntime('nodejs6.10'))
})

test('throwIfWrongPluginOrder()', (t) => {
  t.throws(
    () => throwIfWrongPluginOrder(['serverless-plugin-chrome', 'serverless-plugin-typescript']),
    Error,
    'Should throw when our plugin comes before the "serverless-plugin-typescript" plugin.'
  )

  t.notThrows(
    () => throwIfWrongPluginOrder(['serverless-plugin-typescript', 'serverless-plugin-chrome']),
    'Should not throw when our plugin comes after the "serverless-plugin-typescript" plugin.'
  )

  t.notThrows(
    () => throwIfWrongPluginOrder(['serverless-plugin-chrome']),
    'Should not throw when only our plugin is used.'
  )

  t.throws(
    () =>
      throwIfWrongPluginOrder([
        'serverless-webpack',
        'bogus',
        'serverless-plugin-chrome',
        'serverless-plugin-typescript',
      ]),
    Error,
    'Should throw when plugins are in order known to not work.'
  )

  t.notThrows(
    () =>
      throwIfWrongPluginOrder([
        'bogus',
        'serverless-plugin-typescript',
        'serverless-plugin-chrome',
        'bogus',
        'serverless-webpack',
      ]),
    'Should not throw when plugins are in order known to work.'
  )
})

test('getHandlerFileAndExportName()', (t) => {
  const { filePath, fileName, exportName } = getHandlerFileAndExportName('nested/test/handler.foobar.test')

  t.is(filePath, 'nested/test')
  t.is(fileName, 'handler.foobar.js')
  t.is(exportName, 'test')
})
