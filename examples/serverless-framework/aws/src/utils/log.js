export default function log (...stuffToLog) {
  if (process.env.LOGGING) {
    console.log(...stuffToLog)
  }
}
