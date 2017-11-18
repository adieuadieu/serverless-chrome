const launch = require('@serverless-chrome/lambda')

const handler = 'REPLACE_WITH_HANDLER_REQUIRE'
const options = 'REPLACE_WITH_OPTIONS'

module.exports.REPLACE_WITH_EXPORT_NAME = function ensureHeadlessChrome (event, context, callback) {
  (typeof launch === 'function' ? launch : launch.default)(options)
    .then((instance) => {
      handler.REPLACE_WITH_EXPORT_NAME(event, context, callback, instance)
    })
    .catch((error) => {
      console.error(
        'Error occured in serverless-plugin-chrome wrapper when trying to ' +
          'ensure Chrome for REPLACE_WITH_EXPORT_NAME() handler.',
        options,
        error
      )
    })
}
