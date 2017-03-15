import captureScreenshotHandler from './handlers/captureScreenshot'
import userConfig from '../config'

// TODO: clean up the flags we don't need/care about
const defaultChromeFlags = [
  '--headless', // Redundant?
  '--disable-gpu', // TODO: should we do this?
  '--window-size=1280x1696', // Letter size
  '--no-sandbox',
  '--user-data-dir=/tmp/user-data',
  '--hide-scrollbars',
  '--enable-logging',
  '--log-level=0',
  '--v=99',
  '--single-process',
  '--data-path=/tmp/data-path',

  '--ignore-certificate-errors', // Dangerous?

  // '--no-zygote', // Disables the use of a zygote process for forking child processes. Instead, child processes will be forked and exec'd directly. Note that --no-sandbox should also be used together with this flag because the sandbox needs the zygote to work.

  '--homedir=/tmp',
  // '--media-cache-size=0',
  // '--disable-lru-snapshot-cache',
  // '--disable-setuid-sandbox',
  // '--disk-cache-size=0',
  '--disk-cache-dir=/tmp/cache-dir',

  // '--use-simple-cache-backend',
  // '--enable-low-end-device-mode',

  // '--trace-startup=*,disabled-by-default-memory-infra',
  //'--trace-startup=*',
]

const defaultChromeConfig = {
  pageLoadTimeout: 1000 * 60, // Give the page max 60 seconds to load. time is money!
}

export default {
  // log some extra stuff. It'll show up in your CloudWatch logs
  logging: false,

  // this is a function which will get executed after chrome has spawned
  handler: captureScreenshotHandler,

  // *** //

  ...userConfig,

  chromeFlags: [...defaultChromeFlags, ...(userConfig.chromeFlags || [])],
  chrome: {
    ...defaultChromeConfig,
    ...userConfig.chrome,
  },
}
