export default function ServerlessChromeLambda(options?: Option): Promise<ServerLessChrome>;

type Option = {
  flags?: string[],
  chromePath?: string,
  port?: number,
  forceLambdaLauncher?: boolean,
};

type ServerLessChrome = {
  pid: number,
  port: number,
  url: string,
  log: string,
  errorLog: string,
  pidFile: string,
  metaData: {
    launchTime: number,
    didLaunch: boolean,
  },
  kill: () => void,
};
