const path = require('path');
const APP_PATH = path.resolve(__dirname, 'src');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: ['./src/index.ts'],
  target: 'node',
  node: {
    __dirname: false
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: '',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        include: APP_PATH,
        test: /\.ts?$/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-typescript',
          ],
          plugins: [
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            ['@babel/plugin-proposal-class-properties', { loose: true }],
            '@babel/plugin-proposal-optional-chaining',
          ],
        },
      },
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve('src/templates'), to: 'templates' }
      ],
    }),
  ],
  optimization: {
    minimize: true
  },
  externals: ['art-template'],
};
