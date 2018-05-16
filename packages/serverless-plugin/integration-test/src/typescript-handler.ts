import * as cdp from 'chrome-remote-interface'

export default async function (event, context, callback, chrome) {
  return {
    versionInfo: await cdp.Version(),
    chrome,
  }
}
