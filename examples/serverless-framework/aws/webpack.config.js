// const fs = require('fs')
// const path = require('path')
const webpack = require('webpack')
// const yaml = require('js-yaml')
const slsw = require('serverless-webpack')

// const { functions: slsFunctions } = yaml.load(fs.readFileSync('./serverless.yml'))

module.exports = {
  devtool: 'source-map',
  target: 'node',
  node: {
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          cacheDirectory: true,
        },
      },
      { test: /\.json$/, loader: 'json-loader' },
    ],
  },
  resolve: {
    symlinks: true,
  },
  output: {
    libraryTarget: 'commonjs',
    path: `${__dirname}/.webpack`,
    filename: '[name].js',
  },
  externals: ['aws-sdk'],
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  /* entry: Object.keys(slsFunctions)
    .reduce((functions, key) => [...functions, slsFunctions[key]], [])
    .reduce((entries, lambdaFunction) => {
      const handler = lambdaFunction.handler.split('.')[0]

      return Object.assign(entries, {
        [handler]: path.resolve(`${handler}.js`),
      })
    }, {}), */
  entry: slsw.lib.entries,
}
