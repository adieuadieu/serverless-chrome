// eslint-disable-next-line import/prefer-default-export
export async function generatePdf (event, context, callback) {
  const { queryStringParameters: { url } } = event

  console.log(event)

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      url,
      input: event,
    }),
  }

  // redirection? https://aws.amazon.com/blogs/compute/redirection-in-a-serverless-api-with-aws-lambda-and-amazon-api-gateway/

  console.log(`Completed processing event for URL ${url}`)

  return callback(null, response)
}
