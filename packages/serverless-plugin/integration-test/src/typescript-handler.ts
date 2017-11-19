import * as CDP from 'chrome-remote-interface'

export default async function (event, context, callback, chrome) {
  CDP.Version()
    .then((versionInfo) => {
      callback(null, {
        versionInfo,
        chrome,
      })
    })
    .catch(callback)
}
