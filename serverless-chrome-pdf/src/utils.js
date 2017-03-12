import uuidV4 from 'uuid/v4'

// eslint-disable-next-line import/prefer-default-export
export function makeKey () {
  return uuidV4()
}
