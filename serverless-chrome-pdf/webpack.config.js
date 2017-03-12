const path = require('path')
const decompress = require('decompress')
const webpack = require('webpack')

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
    alias: {
      ws: 'node_modules/ws',
    },
  },
  output: {
    libraryTarget: 'commonjs',
    path: '.webpack',
    filename: 'handler.js', // this should match the first part of function handler in serverless.yml
  },
  externals: ['aws-sdk', 'child_process', 'fs'],
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: `exports?global.Buffer!${path.resolve('./src', 'buffer-polyfill')}`, // https://gist.github.com/Couto/b29676dd1ab8714a818f
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.UglifyJsPlugin({ minimize: true, sourceMap: false, warnings: false }),
    new ExtractTarballPlugin(path.join(__dirname, 'lib/chrome-headless-linux-x64.tar.gz'), path.join(__dirname, '.webpack/')),
  ],
}
