const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    captureScreenshotHtml:'./src/captureScreenshotHtml',
    captureScreenshotBinary:'./src/captureScreenshotBinary',
    experimental:'./src/experimental',
    printToPdfHtml:'./src/printToPdfHtml',
    printToPdfBinary:'./src/printToPdfBinary',
    requestLogger:'./src/requestLogger',
    versionInfo:'./src/versionInfo',
  },
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: __dirname,
        exclude: /node_modules/,
      },
      { test: /\.json$/, loader: 'json-loader' },
    ],
  },
  resolve: {
    symlinks: false
  },
  output: {
    libraryTarget: 'commonjs',
    path: __dirname+'/.webpack',
    filename: '[name].js'
  },
  externals: ['aws-sdk'],
  plugins: [
  ],
}