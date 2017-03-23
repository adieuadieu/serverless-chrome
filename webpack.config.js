const path = require('path')
const decompress = require('decompress')
const webpack = require('webpack')

const chromeTarball = path.join(__dirname, 'chrome/chrome-headless-lambda-linux-x64.tar.gz')
const webpackDir = path.join(__dirname, '.webpack/')

function ExtractTarballPlugin (archive, to) {
  return {
    apply: (compiler) => {
      compiler.plugin('emit', (compilation, callback) => {
        decompress(path.resolve(archive), path.resolve(to))
          .then(() => callback())
          .catch(error => console.error('Unable to extract archive ', archive, to, error.stack))
      })
    },
  }
}

module.exports = {
  // entry: './src/handler',
  entry: './src/handler',
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: __dirname,
        exclude: /node_modules/,
      },
      { test: /\.json$/, loader: 'json-loader' },
    ],
  },
  resolve: {
    root: __dirname,
  },
  output: {
    libraryTarget: 'commonjs',
    path: '.webpack',
    filename: 'handler.js', // this should match the first part of function handler in serverless.yml
  },
  externals: ['aws-sdk'],
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.UglifyJsPlugin({ minimize: true, sourceMap: false, warnings: false }),
    new ExtractTarballPlugin(chromeTarball, webpackDir),
  ],
}
