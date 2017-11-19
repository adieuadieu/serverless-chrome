const CDP = require('chrome-remote-interface')

module.exports.default = (event, context, callback, chrome) => {
  CDP.Version()
    .then((versionInfo) => {
      callback(null, {
        versionInfo,
        chrome,
      })
    })
    .catch(callback)
}
