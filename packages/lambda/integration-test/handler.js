const path = require('path')
const chrome = require('./dist/bundle.cjs.js')

module.exports.run = function run (event, context, callback) {
  console.log('started')

  chrome({ chromePath: path.resolve(__dirname, './headless_shell') })
    .then((instance) => {
      console.log('we got here. sweet.', instance)

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
      console.log('error', error)

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
