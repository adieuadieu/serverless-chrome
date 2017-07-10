const Cdp = require('chrome-remote-interface');
const { log, sleep } = require('./utils');

module.exports = function captureScreenshotOfUrl(url) {
  const LOAD_TIMEOUT = process.env.PAGE_LOAD_TIMEOUT || 1000 * 60;

  let client;
  let loaded = false;

  const loading = (startTime = Date.now()) => {
    return sleep(100).then(() => {
      if (!loaded && Date.now() - startTime < LOAD_TIMEOUT) {
        return loading(startTime);
      }
      return true;
    })
  };

  return Cdp.List()
    .then((data) => Cdp({ host: '127.0.0.1', target: data.tab }))
    .then((conn) => {
      client = conn;

      const { Network, Page } = conn;
      Network.requestWillBeSent((params) => {
        log('Chrome is sending request for:', params.request.url)
      });

      Page.loadEventFired(() => {
        loaded = true;
        client.close();
      });

      if (process.env.LOGGING === 'TRUE') {
        Cdp.Version((err, info) => {
          console.log('CDP version info', err, info)
        })
      }

      return Promise.all([
        Network.enable(), // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Network/#method-enable
        Page.enable() // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-enable
      ])
    })
    .then(() => Page.navigate({ url })) // https://chromedevtools.github.io/debugger-protocol-viewer/tot/Page/#method-navigate
    .catch((err) => {
      console.error(err);
      client.close();
    })
    .then(() => loading())
    // TODO: resize the chrome "window" so we capture the full height of the page
    .then(() => Page.captureScreenshot())

    .then((data) => {
      return data;
    });

};
