const cdp = require('chrome-remote-interface')

module.exports.default = async (event, context, callback, chrome) => ({
  versionInfo: await cdp.Version(),
  chrome,
})
