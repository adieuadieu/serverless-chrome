import config from './config'

export default function log (...stuffToLog) {
  if (config.logging) console.log(...stuffToLog)
}
