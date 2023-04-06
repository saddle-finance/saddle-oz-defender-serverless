const glob = require('glob');
const path = require('path');

module.exports = {
  entry: glob.sync('./src/**/index.ts').reduce(function(obj, filePath){
    const parentDir = path.basename(path.dirname(filePath))
    obj[parentDir] = filePath;
    return obj
  },{}),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "[name]/index.js"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    usedExports: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'production'
}