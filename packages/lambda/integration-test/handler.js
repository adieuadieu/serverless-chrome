const path = require('path')
const chrome = require('./dist/bundle.cjs.js')
const cdp = require('chrome-remote-interface')

module.exports.run = async function run (event) {
  const channel = `${event.channel}-` || ''

  console.log('started. Channel:', channel)

  try {
    const instance = await chrome({
      chromePath: path.resolve(__dirname, `./dist/${channel}headless-chromium`),
    })

    console.log('we got here. sweet.', instance)

    return {
      statusCode: 200,
      body: JSON.stringify({
        event,
        instance,
        versionInfo: await cdp.Version(),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  } catch (error) {
    console.log('error', error)

    return {
      statusCode: 200,
      body: JSON.stringify({
        error,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  }
}
