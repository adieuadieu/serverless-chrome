import { execSync } from 'child_process'

export function clearConnection (client) {
  if (client) {
    client.removeAllListeners()
    client.end()
    client.destroy()
    client.unref()
  }
}

export function debug (...args) {
  return process.env.DEBUG
    ? console.log('@serverless-chrome/lambda:', ...args)
    : undefined
}

export async function delay (time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export function makeTempDir () {
  return execSync('mktemp -d -t chrome.XXXXXXX')
    .toString()
    .trim()
}

/**
 * Checks if a process currently exists by process id.
 * @param pid number process id to check if exists
 * @returns boolean true if process exists, false if otherwise
 */
export function processExists (pid) {
  let exists = true
  try {
    process.kill(pid, 0)
  } catch (error) {
    exists = false
  }
  return exists
}
