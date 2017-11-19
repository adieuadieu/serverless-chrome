const webpack = require('webpack')
const slsw = require('serverless-webpack')

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
  entry: slsw.lib.entries,
}
