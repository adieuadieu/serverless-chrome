import { execSync } from 'child_process'
import net from "net"

export function clearConnection (client: net.Socket) {
  if (client) {
    client.removeAllListeners()
    client.end()
    client.destroy()
    client.unref()
  }
}

export function debug (...args: any[]) {
  return process.env.DEBUG
    ? console.log('@serverless-chrome/lambda:', ...args)
    : undefined
}

export async function delay (time: number) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function makeTempDir () {
  return execSync('mktemp -d -t chrome.XXXXXXX')
    .toString()
    .trim()
}
