/*
@TODO: only download the archive if we haven't already downloaded it.
@TODO: peg to an archive version, so each package version only downloads specific chrome version
        using pkg.config.chromeVersion
@TODO: checksum/crc check on archive using pkg.config.tarballChecksum
*/
const fs = require('fs')
const path = require('path')
const https = require('https')
const extract = require('extract-zip')

const TARBALL_FILENAME = 'chrome-headless-lambda-linux-x64.zip'
const TARBALL_URL = `https://raw.githubusercontent.com/adieuadieu/serverless-chrome/develop/packages/lambda/chrome/${TARBALL_FILENAME}`
const DOWNLOAD_PATH = path.resolve(__dirname, '../', TARBALL_FILENAME)
const EXTRACT_PATH = path.resolve(__dirname, '../', 'dist')

function download (url = TARBALL_URL, destination = DOWNLOAD_PATH) {
  const file = fs.createWriteStream(destination)

  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        response.pipe(file)

        file.on('finish', () => {
          file.close(resolve)
        })
      })
      .on('error', (error) => {
        fs.unlink(destination)
        reject(error)
      })
  })
}

// unzips and makes path.txt point at the correct executable
function extractFile (file = DOWNLOAD_PATH, destination = EXTRACT_PATH) {
  return new Promise((resolve, reject) => {
    extract(file, { dir: destination }, (error) => {
      if (error) {
        return reject(error)
      }

      return resolve()
    })
  })
}

if (require.main === module) {
  console.log('Downloading precombiled headless Chrome binary for AWS Lambda')

  download().then(extractFile).then(() => fs.unlink(DOWNLOAD_PATH)).catch((error) => {
    console.error(error)
  })
}

module.exports = {
  download,
  extractFile,
}
