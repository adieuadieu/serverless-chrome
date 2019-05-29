import debug from "debug";
import LambdaChromeLauncher from "./launcher";

const log = debug("@serverless-chrome/lambda");

const DEVTOOLS_HOST = "http://127.0.0.1";

// Prepend NSS related libraries and binaries to the library path and path respectively on lambda.
/* if (process.env.AWS_EXECUTION_ENV) {
  const nssSubPath = fs.readFileSync(path.join(__dirname, 'nss', 'latest'), 'utf8').trim();
  const nssPath = path.join(__dirname, 'nss', subnssSubPathPath);

  process.env.LD_LIBRARY_PATH = path.join(nssPath, 'lib') +  ':' + process.env.LD_LIBRARY_PATH;
  process.env.PATH = path.join(nssPath, 'bin') + ':' + process.env.PATH;
} */

// persist the instance across invocations
// when the *lambda* container is reused.
let chromeInstance: LambdaChromeLauncher | undefined;

export interface LaunchOption {
  flags?: string[];
  chromePath?: string;
  port?: number;
  forceLambdaLauncher?: boolean;
}

export default async function launch({
  flags: chromeFlags = [],
  chromePath,
  port,
  forceLambdaLauncher = false,
}: LaunchOption = {}) {
  if (!chromeInstance || !processExists(chromeInstance.pid!)) {
    if (process.env.AWS_EXECUTION_ENV || forceLambdaLauncher) {
      chromeInstance = new LambdaChromeLauncher({
        chromePath,
        chromeFlags,
        port,
      });
    } else {
      // This let's us use chrome-launcher in local development,
      // but omit it from the lambda function's zip artifact
      try {
        const { Launcher: LocalChromeLauncher } = require("chrome-launcher");
        chromeInstance = (new LocalChromeLauncher({
          chromePath,
          chromeFlags,
          port,
        })) as LambdaChromeLauncher;
      } catch (error) {
        throw new Error('@serverless-chrome/lambda: Unable to find "chrome-launcher". ' +
            "Make sure it's installed if you wish to develop locally.");
      }
    }
  }

  log("Spawning headless shell");

  const launchStartTime = Date.now();

  try {
    await chromeInstance.launch();
  } catch (error) {
    log("Error trying to spawn chrome:", error);

    throw new Error("Unable to start Chrome. If you have the DEBUG env variable set," +
        "there will be more in the logs.");
  }

  const launchTime = Date.now() - launchStartTime;

  log("It took %dms to spawn chrome.", launchTime);

  // unref the chrome instance, otherwise the lambda process won't end correctly
  /* @TODO: make this an option?
    There's an option to change callbackWaitsForEmptyEventLoop in the Lambda context
    http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
    Which means you could log chrome output to cloudwatch directly
    without unreffing chrome.
  */
  if (chromeInstance.chrome) {
    chromeInstance.chrome.unref();
  }

  return {
    pid: chromeInstance.pid,
    port: chromeInstance.port,
    url: `${DEVTOOLS_HOST}:${chromeInstance.port}`,
    metaData: {
      launchTime,
      didLaunch: !!chromeInstance.pid,
    },
    async kill() {
      if (chromeInstance) {
        await chromeInstance.kill();
        chromeInstance = undefined;
      }
    },
  };
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}
