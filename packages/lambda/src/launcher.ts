/*
  Large portion of this is inspired by/taken from Lighthouse/chrome-launcher.
  It is Copyright Google Inc, licensed under Apache License, Version 2.0.
  https://github.com/GoogleChrome/lighthouse/blob/master/chrome-launcher/chrome-launcher.ts

  We ship a modified version because the original verion comes with too
  many dependencies which complicates packaging of serverless services.
*/

import { ChildProcess, spawn } from "child_process";
import debug from "debug";
import * as net from "net";
import * as path from "path";

const DEFAULT_CHROME_FLAGS = new Set<string>([
  "--disable-dev-shm-usage", // disable /dev/shm tmpfs usage on Lambda

  // @TODO: review if these are still relevant:
  "--disable-gpu",
  "--single-process", // Currently wont work without this :-(

  // https://groups.google.com/a/chromium.org/d/msg/headless-dev/qqbZVZ2IwEw/Y95wJUh2AAAJ
  "--no-zygote", // helps avoid zombies

  "--no-sandbox",
]);

const CHROME_PATH = path.resolve(__dirname, "./headless-chromium");

export interface LauncherOptions {
  pollInterval?: number;
  chromePath?: string;
  chromeFlags?: string[];
  startingUrl?: string;
  port?: number;
  debug?: boolean;
}

export default class LambdaChromeLauncher {
  public chrome?: ChildProcess;

  private readonly requestedPort?: number;
  private readonly chromePath: string;
  private readonly chromeFlags: Set<string>;
  private readonly pollInterval: number;
  private readonly startingUrl: string;
  private readonly debug: boolean;

  private readonly log = debug("@serverless-chrome/lambda");

  constructor(options: LauncherOptions = {}) {
    const {
      pollInterval = 500,
      chromePath = CHROME_PATH,
      chromeFlags = [],
      startingUrl = "about:blank",
      port,
    } = options;

    this.debug = !!options.debug;
    this.pollInterval = pollInterval;
    this.requestedPort = port;
    this.startingUrl = startingUrl;
    this.chromePath = chromePath;
    this.chromeFlags = new Set([
      ...this.debug ? ["--enable-logging", "--log-level=0"] : [],
      ...DEFAULT_CHROME_FLAGS,
      `--remote-debugging-port=${this.port}`,
      "--disable-setuid-sandbox",
      ...chromeFlags,
    ]);
  }

  public get port() {
    return this.requestedPort || 9222;
  }

  public get flags() {
    return [
      ...this.chromeFlags,
      this.startingUrl,
    ];
  }

  public get pid() {
    return this.chrome ? this.chrome.pid : null;
  }

  public async launch(): Promise<void> {
    if (this.requestedPort) {
      // If an explicit port is passed first look for an open connection...
      try {
        return await this.ensureReady();
      } catch (e) {
        this.log("No debugging port found on port %d, launching a new Chrome", this.port);
      }
    }

    if (this.chrome) {
      this.log(`Chrome already running with pid %d.`, this.chrome.pid);
    } else {
      this.chrome = await this.spawn();
      await this.waitUntilReady();
    }
  }

  public async kill() {
    if (this.chrome) {
      this.log("Trying to terminate Chrome instance");
      try {
        process.kill(-this.chrome.pid);

        this.log("Waiting for Chrome to terminate..");
        await this.waitUntilKilled();
        this.chrome = undefined;
        this.log("Chrome successfully terminated.");
      } catch (e) {
        this.log("Chrome could not be killed", e);
        throw e;
      }
    }
  }

  private spawn(): ChildProcess {
    const proc = spawn(this.chromePath, this.flags, {
      detached: true,
      stdio: this.debug ? ["ignore", process.stdout, process.stderr] : "ignore",
    });

    // unref the chrome instance, otherwise the lambda process won't end correctly
    proc.unref();

    this.log("Chrome running with pid %d on port %d.", proc.pid, this.port);

    return proc;
  }

  // resolves if ready, rejects otherwise
  private ensureReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = net.createConnection(this.port)
        .setTimeout(1000) // @todo make it customizable?
        .once("error", onError)
        .once("connect", onConnect)
        .once("timeout", onTimeout);

      function onError(e: Error) {
        client
          .removeListener("connect", onConnect)
          .removeListener("timeout", onTimeout);

        reject(e);
      }

      function onConnect() {
        client
          .removeListener("error", onError)
          .removeListener("timeout", onTimeout);

        client.end();
        resolve();
      }

      function onTimeout() {
        client
          .removeListener("error", onError)
          .removeListener("connect", onConnect);

        reject(new Error("Connection timed out"));
      }
    });
  }

  // resolves when debugger is ready, rejects after 10 polls
  private async waitUntilReady(): Promise<void> {
    const MAX_RETRIES = 10;
    let retries = 0;

    while (retries++ < MAX_RETRIES) {
      log("Waiting for Chrome", retries);

      try {
        await this.ensureReady();
        this.log("Started Chrome");
        return;
      } catch (e) {
        await this.sleep(this.pollInterval);
      }
    }
  }

  // resolves when chrome is killed, rejects  after 10 polls
  private async waitUntilKilled(): Promise<void> {
    await Promise.all([
      new Promise((resolve, reject) => {
        const self = this;
        const MAX_RETRIES = 10;
        let retries = 0;

        const server = net.createServer()
          .on("listening", onListen)
          .on("error", onError);

        function onListen() {
          self.log("Confirmed Chrome killed");
          server.close(resolve);
        }

        function onError(e: Error) {
          if (retries++ < MAX_RETRIES) {
            setTimeout(() => server.listen(self.port), self.pollInterval);
          } else {
            reject(new Error("Chrome is still running after 10 retries"));
          }
        }

        this.log("Waiting for Chrome to terminate..", retries);

        server.listen(this.port);
      }),
      new Promise((resolve) => {
        if (!this.chrome || this.chrome.killed) {
          return resolve();
        } else {
          this.chrome.once("close", resolve);
        }
      }),
    ]);
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }
}
