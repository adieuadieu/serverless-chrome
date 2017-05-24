import captureScreenshotHandler from './handlers/captureScreenshot'
import userConfig from '../config'

// TODO: clean up the flags we don't need/care about
const defaultChromeFlags = [
  '--disable-gpu', // TODO: should we do this?
  '--window-size=1280x1696', // Letter size portrait
  // '--window-size=1696x1280', // Letter size landscape
  '--single-process',

  '--disable-setuid-sandbox', // https://chromium.googlesource.com/chromium/src/+/master/docs/linux_suid_sandbox_development.md
  '--no-sandbox', // required, https://chromium.googlesource.com/chromium/src/+/master/docs/linux_sandboxing.md

  // https://cs.chromium.org/chromium/src/content/public/common/content_switches.cc?type=cs&l=662
  // '--no-zygote', // Disables the use of a zygote process for forking child processes. Instead, child processes will be forked and exec'd directly. Note that --no-sandbox should also be used together with this flag because the sandbox needs the zygote to work.

  // experimental:
  '--allow-no-sandbox-job',
  '--disable-gpu-sandbox',
  // '--internal-nacl',
  '--disable-seccomp-filter-sandbox',
  // '--renderer-cmd-prefix', // https://chromium.googlesource.com/chromium/src/+/master/docs/linux_zygote.md
  '--enable-sandbox-logging',

  '--hide-scrollbars',

  '--user-data-dir=/tmp',
  '--data-path=/tmp',
  '--homedir=/tmp',
  '--disk-cache-dir=/tmp',
]

const defaultChromeConfig = {
  pageLoadTimeout: 1000 * 20, // Give the page max 20 seconds to load. time is money!
}

export default {
  // log some extra stuff. It'll show up in your CloudWatch logs
  logging: false,

  // this is a function which will get executed after chrome has spawned
  handler: captureScreenshotHandler,

  // *** //

  ...userConfig,

  // trim the flags, because chrome may not start properly if the value includes a trailing space..
  chromeFlags: [...defaultChromeFlags, ...(userConfig.chromeFlags || [])]
    .filter(flag => typeof flag === 'string')
    .map(flag => flag.trim()),

  chrome: {
    ...defaultChromeConfig,
    ...userConfig.chrome,
  },
}
