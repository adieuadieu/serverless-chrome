/*
@TODO: only download the archive if we haven't already downloaded it.
@TODO: checksum/crc check on archive using pkg.config.tarballChecksum
*/
const fs = require('fs')
const path = require('path')
const https = require('https')
const extract = require('extract-zip')

function unlink(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, err => err ? reject(err) : resolve());
  });
}

function rename(from, to) {
  return new Promise((resolve, reject) => {
    fs.rename(from, to, err => err ? reject(err) : resolve());
  })
}

function extractFile (file, destination) {
  return new Promise((resolve, reject) => {
    extract(file, { dir: destination }, err => err ? reject(err) : resolve());
  })
}

function download (url, destination) {
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

const RAW_PACKAGES_URL = 'https://raw.githubusercontent.com/qubyte/serverless-chrome/nss/packages';

function downloadChrome() {
  const ZIP_FILENAME = process.env.npm_package_config_chromeZipFileName;
  const ZIP_URL = `${RAW_PACKAGES_URL}/lambda/chrome/${ZIP_FILENAME}`
  const DOWNLOAD_PATH = path.resolve(__dirname, '..', ZIP_FILENAME)
  const EXTRACT_PATH = path.resolve(__dirname, '..', 'dist')

  console.log('Downloading precompiled headless Chrome binary for AWS Lambda.')

  return download(ZIP_URL, DOWNLOAD_PATH)
    .then(() => extractFile(DOWNLOAD_PATH, EXTRACT_PATH))
    .then(() => unlink(DOWNLOAD_PATH))
    .then(() => console.log('Completed Chrome download.'))
    .catch(error => console.error(error))
}

function downloadNss() {
  const ZIP_FILENAME = process.env.npm_package_config_nssZipFileName;
  const ZIP_URL = `${RAW_PACKAGES_URL}/lambda/nss/${ZIP_FILENAME}`
  const DOWNLOAD_PATH = path.resolve(__dirname, '..', ZIP_FILENAME)
  const EXTRACT_PATH = path.resolve(__dirname, '..', 'dist')

  console.log('Downloading precompiled NSS library and binaries for AWS Lambda.')

  return download(ZIP_URL, DOWNLOAD_PATH)
    .then(() => extractFile(DOWNLOAD_PATH, EXTRACT_PATH))
    .then(() => unlink(DOWNLOAD_PATH))
    .then(() => rename(path.join(EXTRACT_PATH, 'dist'), path.join(EXTRACT_PATH, 'nss')))
    .then(() => console.log('Completed NSS download.'))
    .catch(error => console.error(error))
}

if (require.main === module) {
  downloadChrome()
    .then(downloadNss);
}

module.exports = {
  download,
  extractFile,
}
