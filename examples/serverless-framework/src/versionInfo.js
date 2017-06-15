const launchChrome = require('@serverless-chrome/lambda')
const CDP = require('chrome-remote-interface')

module.exports.handler = function handler (event, context, callback) {
  launchChrome({
    flags: ['--window-size=1280x1696', '--hide-scrollbars'],
  })
    .then((chrome) => {
      // Chrome is now running on localhost:9222

      CDP.Version()
        .then((versionInfo) => {
          callback(null, {
            statusCode: 200,
            body: JSON.stringify({
              versionInfo,
              chrome,
            }),
            // headers: {
            // 'Content-Type': 'application/json',
            // },
          })
        })
        .catch((error) => {
          callback(null, {
            statusCode: 500,
            body: JSON.stringify({
              error,
            }),
          })
        })
    })
    .catch((error) => {
      // Chrome didn't launch correctly

      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          error,
        }),
      })
    })
}

if (require.main === module) {
  module.exports.handler({}, {}, console.log)
}
