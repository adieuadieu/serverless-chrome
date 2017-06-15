export function log (...stuffToLog) {
  if (process.env.LOGGING) console.log(...stuffToLog)
}

export function sleep (miliseconds = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
}
