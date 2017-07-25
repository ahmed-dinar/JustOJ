
var path = require('path');
var GoogleFontsPlugin = require('google-fonts-webpack-plugin');

module.exports = {

  entry: './src/assets/fonts/null.js',
  output: {
    path: path.resolve(__dirname, '../src/assets/fonts'),
    filename: 'empty.js'
  },
  plugins:[

    new GoogleFontsPlugin({
      fonts: [
        {
          family: 'Source Sans Pro',
          variants: [ '400', '600', '700' ],
          subsets: ['latin', 'greek']
        }
      ],
      path: 'font/',
      formats: ['woff','woff2'],
      filename: 'fonts.css'
    }),
  ]
};