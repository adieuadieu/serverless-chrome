const debug = require('debug')('handler')
const chrome = require('../dist/bundle.cjs.js')

module.exports.run = function run (event, context, callback) {
  debug('started')

  chrome()
    .then((instance) => {
      debug('we got here. sweet.', instance)

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          event,
          instance,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
    .catch((error) => {
      debug('error', error)

      callback({
        statusCode: 200,
        body: JSON.stringify({
          error,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })
}
