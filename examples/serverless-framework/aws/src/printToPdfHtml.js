//
//
// HEY! Be sure to re-incorporate changes from @albinekb
// https://github.com/adieuadieu/serverless-chrome/commit/fca8328134f1098adf92e115f69002e69df24238
//
//
//
import { log } from './utils'
import printUrlToPdf, { makePrintOptions } from './printToPdf'

export default (async function printToPdfBinaryHandler (event) {
  const { queryStringParameters: { url, ...printParameters } } = event
  const printOptions = makePrintOptions(printParameters)
  let pdf

  log('Processing PDFification for', url, printOptions)

  const startTime = Date.now()

  try {
    pdf = await printUrlToPdf(url, printOptions)
  } catch (error) {
    console.error('Error printing pdf for', url, error)
    throw new Error('Unable to print pdf')
  }

  const endTime = Date.now()

  // TODO: probably better to write the pdf to S3,
  // but that's a bit more complicated for this example.
  return {
    statusCode: 200,
    body: `
      <html>
        <body>
          <p><a href="${url}">${url}</a></p>
          <p><code>${JSON.stringify(printOptions, null, 2)}</code></p>
          <p>Chromium took ${endTime - startTime} ms to load URL and render PDF.</p>
          <embed src="data:application/pdf;base64,${pdf}" width="100%" height="100%" type='application/pdf'>
        </body>
      </html>
    `,
    headers: {
      'Content-Type': 'text/html',
    },
  }
})
