import Cdp from 'chrome-remote-interface'

export default async function version () {
  return Cdp.Version()
}
