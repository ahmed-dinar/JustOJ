var utils = require('./utils');
var webpack = require('webpack');
var config = require('../config');
var merge = require('webpack-merge');
var baseWebpackConfig = require('./webpack.base.conf');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
var GoogleFontsPlugin = require('google-fonts-webpack-plugin');

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name]);
});

module.exports = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',
  plugins: [

    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),

    new GoogleFontsPlugin({
      fonts: [
        { family: 'Inconsolata', variants: [ '400','700' ] },
        { family: 'Ubuntu', variants: [ '400', '500', '700' ] },
        { family: 'Open Sans', variants: [ '400', '600', '700' ] },
        { family: 'PT Sans', variants: [ '400', '700' ] },
        { family: 'Source Sans Pro', variants: [ '400', '600', '700' ] },
        { family: 'Roboto', variants: [ '400','500','700','900' ] },
        { family: 'Julius Sans One', variants: [ '400' ] }
      ],
      local: false
    }),

    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
});
