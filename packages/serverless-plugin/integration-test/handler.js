const CDP = require('chrome-remote-interface')

module.exports.hello = (event, context, callback, chrome) => {
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
}
