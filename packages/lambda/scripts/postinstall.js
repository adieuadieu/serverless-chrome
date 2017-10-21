/*
@TODO: checksum/crc check on archive using pkg.config.tarballChecksum
*/
const fs = require('fs')
const path = require('path')
const https = require('https')
const extract = require('extract-zip')

const RELEASE_DOWNLOAD_URL_BASE =
  'https://github.com/adieuadieu/serverless-chrome/releases/download'

function unlink (path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, error => (error ? reject(error) : resolve()))
  })
}

function rename (from, to) {
  return new Promise((resolve, reject) => {
    fs.rename(from, to, error => (error ? reject(error) : resolve()))
  })
}

function extractFile (file, destination) {
  return new Promise((resolve, reject) => {
    extract(file, { dir: destination }, error => (error ? reject(error) : resolve()))
  })
}

function get (url, destination) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode >= 300 && response.statusCode <= 400) {
          return get(response.headers.location, destination)
            .then(resolve)
            .catch(reject)
        } else if (response.statusCode !== 200) {
          fs.unlink(destination, () => null)
          return reject(`HTTP ${response.statusCode}: Could not download ${url}`)
        }

        const file = fs.createWriteStream(destination)

        response.pipe(file)

        file.on('finish', () => {
          file.close(resolve)
        })
      })
      .on('error', (error) => {
        fs.unlink(destination, () => null)
        reject(error)
      })
  })
}

function getChromium () {
  const ZIP_FILENAME = 'headless-chromium-amazonlinux-2017-03.zip'
  const ZIP_URL = `${RELEASE_DOWNLOAD_URL_BASE}/${process.env.npm_package_version}/${ZIP_FILENAME}`
  const DOWNLOAD_PATH = path.resolve(__dirname, '..', ZIP_FILENAME)
  const EXTRACT_PATH = path.resolve(__dirname, '..', 'dist')

  if (fs.existsSync(DOWNLOAD_PATH)) {
    console.log('Precompiled headless Chromium binary for AWS Lambda previously downloaded. Skipping download.')
    return Promise.resolve()
  }

  console.log('Downloading precompiled headless Chromium binary for AWS Lambda.')

  return get(ZIP_URL, DOWNLOAD_PATH)
    .then(() => extractFile(DOWNLOAD_PATH, EXTRACT_PATH))
    .then(() => console.log('Completed Headless Chromium download.'))
}

if (require.main === module) {
  getChromium().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  get,
  extractFile,
}
