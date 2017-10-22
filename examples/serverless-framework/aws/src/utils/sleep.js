export default function sleep (miliseconds = 100) {
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
}
