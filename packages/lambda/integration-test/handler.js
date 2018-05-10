const path = require('path')
const CDP = require('chrome-remote-interface')
const launchChrome = require('./dist/bundle.cjs.js')

module.exports.run = function run (event, context, callback) {
  const channel = event.channel || 'stable'

  console.log('started. Channel:', channel)

  launchChrome({
    chromePath: path.resolve(__dirname, `./dist/${channel}-headless-chromium`),
  })
    .then((instance) => {
      console.log('we got here. sweet.', instance)
      return instance
    })
    .then((instance) => {
      console.log('gonna run navigateTest')
      return navigateTest().then(() => instance)
    })
    .then((instance) => {
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

function navigateTest () {
  return new Promise((res, rej) => {
    CDP((client) => {
      const { Page, Runtime } = client

      Promise.all([Page.enable(), Runtime.enable()])
        .then(() => Page.navigate({ url: 'https://github.com' }))
        .then(() => Runtime.evaluate({ expression: 'window.location.href' }))
        .then((resp) => console.log(resp))
        .catch((err) => {
          client.close()
          rej(err)
        })
    }).on('error', (err) => {
      // cannot connect to the remote endpoint
      rej(err)
    })
  })
}
