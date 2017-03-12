import uuidV4 from 'uuid/v4'

export function makeKey () {
  return `pdf/${uuidV4()}.pdf`
}

export function sleep (miliseconds = 1000) {
  return new Promise(resolve => setTimeout(() => resolve(), miliseconds))
}
