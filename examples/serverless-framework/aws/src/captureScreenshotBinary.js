const { log } = require('./utils');

const captureScreenshotOfUrl = require('./captureScreenshot');

exports.captureScreenshotBinaryHandler = function(event) {
  const url = event.queryStringParameters.url;

  log('Processing screenshot capture for', url);

  return captureScreenshotOfUrl(url)
    .then((body) => {
      return {
        statusCode: 200,
        body: body, // is in base64
        isBase64Encoded: true,
      }
    }).catch((err) => {
      console.error('Error capturing screenshot for', url, err);
      throw new Error('Unable to capture screenshot')
    });
};
