import './buffer-polyfill'
import AWS from 'aws-sdk'
import printToPdf from './printToPdf'
import { makeKey } from './utils'

// https://www.npmjs.com/package/buffer-v6-polyfill
// https://github.com/webpack/webpack/issues/3984
// https://github.com/webpack/webpack/pull/3986

export const pdfBucket = new AWS.S3({
  params: { Bucket: process.env.S3_PDF_BUCKET },
})

// eslint-disable-next-line import/prefer-default-export
export async function generatePdf (event, context, callback) {
  const { queryStringParameters: { url } } = event
  let pdfUrl = ''

  try {
    const pdf = await printToPdf(url)
    const objectKey = makeKey()

    await pdfBucket
      .upload({
        Key: objectKey,
        Body: pdf,
      })
      .promise()

    pdfUrl = pdfBucket.getSignedUrl('getObject', { Key: objectKey, Expires: 60 * 60 /* expires in 1 hour */ })
  } catch (error) {
    console.error('PDF generation error', error)
    return callback(error)
  }

  const response = {
    statusCode: 301,
    headers: {
      location: pdfUrl,
    },
  }

  // redirection? https://aws.amazon.com/blogs/compute/redirection-in-a-serverless-api-with-aws-lambda-and-amazon-api-gateway/

  console.log(`Completed processing event for URL ${url}`)

  return callback(null, response)
}
