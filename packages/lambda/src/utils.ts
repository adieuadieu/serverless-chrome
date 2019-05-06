import { execSync } from "child_process";
import { Socket } from "net";

export function clearConnection(client: Socket) {
  if (client) {
    client.removeAllListeners();
    client.end();
    client.destroy();
    client.unref();
  }
}

export function debug(...args: any[]): void {
  return process.env.DEBUG
    // tslint:disable-next-line
    ? console.log("@serverless-chrome/lambda:", ...args)
    : undefined;
}

export async function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function makeTempDir(): string {
  return execSync("mktemp -d -t chrome.XXXXXXX")
    .toString()
    .trim();
}

/**
 * Checks if a process currently exists by process id.
 * @param pid number process id to check if exists
 * @returns boolean true if process exists, false if otherwise
 */
export function processExists(pid: number): boolean {
  let exists = true;
  try {
    process.kill(pid, 0);
  } catch (error) {
    exists = false;
  }
  return exists;
}
