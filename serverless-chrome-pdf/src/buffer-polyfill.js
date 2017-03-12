// https://gist.github.com/yyang/f88c4cfa49daa6db2f4855d018aadbdc

import semver from 'semver'

let supportedEncoding = ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'binary', 'hex']
let currentVersion = semver.clean(process.version)

/**
 * Polifills Object to obtain modern APIs.
 * @param  {String} targetVersion  Target version to be polyfilled.
 * @param  {Object} object         Object to polyfill.
 * @param  {Object} methods        An object of all the methods to polyfill.
 * @return {Object}                Polyfilled Object (not necessary to be used).
 */
function polyfill (targetVersion, object, methods) {
  if (!semver.satisfies(currentVersion, targetVersion)) {
    return
  }
  Object.getOwnPropertyNames(methods).forEach((name) => {
    Object.defineProperty(object, name, {
      configurable: false,
      enumerable: false,
      value: methods[name],
      writable: false,
    })
  })
  return object
}

polyfill('<5.10.0', Buffer, {
  from () {
    // Class Method: Buffer.from(array)
    // Original Method: new Buffer(array)
    // Allocates a new Buffer using an array of octets.
    if (Array.isArray(arguments[0])) {
      return new Buffer(arguments[0])
    }

    // Class Method: Buffer.from(str[, encoding])
    // Original Method: new Buffer(str, [encoding])
    // Allocates a new buffer containing the given str.
    // Encoding defaults to 'utf8'.
    if (typeof arguments[0] === 'string') {
      if (arguments[1] && supportedEncoding.indexOf(arguments[1]) !== -1) {
        return new Buffer(arguments[0], arguments[1])
      }
      return new Buffer(arguments[0])
    }

    // Class Method: Buffer.from(arrayBuffer[, byteOffset[, length]])
    // Original Method: new Buffer(arrayBuffer)
    // When passed a reference to the .buffer property of a TypedArray instance,
    // the newly created Buffer will share the same allocated memory as the
    // TypedArray.
    // Note: Requires nodejs version 5.4.0 or greater. Otherwise there won't be
    // a equivilant behaviour.
    if (arguments[0] instanceof ArrayBuffer) {
      if (semver.lt(currentVersion, '5.4.0')) {
        throw new TypeError('new Buffer from ArrayBuffer is only supported' + 'by nodejs version v5.4.0 and greater')
      }

      // Creates new buffer;
      let buffer = new Buffer(arguments[0])

      // Checks the first argument to determine to slice or not
      let byteOffset
      let length
      if (typeof arguments[1] === 'number' && arguments[1] < buffer.length) {
        byteOffset = arguments[1]
      } else {
        byteOffset = 0
      }
      if (typeof arguments[2] === 'number') {
        if (arguments[2] < buffer.length - byteOffset) {
          length = arguments[2]
        }
      } else {
        length = buffer.length - byteOffset
      }

      return buffer.slice(byteOffset, length)
    }

    // Class Method: Buffer.from(buffer)
    // Original Method: new Buffer(buffer)
    // Copies the passed buffer data onto a new Buffer instance.
    if (arguments[0] instanceof Buffer) {
      if (semver.gte(currentVersion, '0.11.15')) {
        return new Buffer(arguments[0])
      }
      // Polyfill for lower versions.
      let buffer = new Buffer(arguments[0].length)
      arguments[0].copy(buffer)
      return buffer
    }

    throw new TypeError('must start with buffer, array or string')
  },
  alloc () {
    // Detects if exception should be thrown.
    if (typeof arguments[0] !== 'number') {
      throw new TypeError('must start with number')
    }
    // Values.
    let buffer = new Buffer(arguments[0])
    let fill = arguments[1]
    let encoding = arguments[2]

    // Fills buffer
    if (encoding && supportedEncoding.indexOf(encoding)) {
      // Suppots encoded fill
      if (semver.gte(currentVersion, '5.7.0')) {
        buffer.fill(fill, encoding)
        // Otherwise write to "fill"
      } else {
        let fillLength = new Buffer(fill, encoding).length
        let repeat = ~~(buffer.length / fillLength) + 1
        for (let i = 0; i < repeat; i++) {
          buffer.write(fill, i * fillLength, encoding)
        }
      }
      // Encoding not specified, otherwise fill safe value.
    } else {
      buffer.fill(fill || undefined)
    }
    return buffer
  },
  allocUnsafe () {
    // Detects if exception should be thrown.
    if (typeof arguments[0] !== 'number') {
      throw new TypeError('must start with number')
    }
    return new Buffer(arguments[0])
  },
})

module.exports = Buffer
