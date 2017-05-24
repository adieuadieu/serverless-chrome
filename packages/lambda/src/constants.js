export const CHROME_PATH = process.env.CHROME_PATH && path.resolve(process.env.CHROME_PATH)
export const HEADLESS_URL = 'http://127.0.0.1:9222'
export const PROCESS_STARTUP_TIMEOUT = 1000 * 5

export const LOGGING_FLAGS = config.logging ? ['--enable-logging', '--log-level=0', '--v=99'] : []
