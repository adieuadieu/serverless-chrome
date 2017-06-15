const chrome = require('@serverless-chrome/lambda')

const handler = 'REPLACE_WITH_HANDLER_REQUIRE'

module.exports.REPLACE_WITH_EXPORT_NAME = function ensureHeadlessChrome (event, context, callback) {
  chrome()
    .then((instance) => {
      handler(event, context, callback, instance)
    })
    .catch((error) => {
      console.log(
        'Error occured in serverless-plugin-headless-chrome wrapper when trying to ensure Chrome.',
        error
      )
    })
}
