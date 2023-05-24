import glob from "glob";
import path from "path";
import webpack from "webpack";
// import TerserPlugin from "terser-webpack-plugin";
interface EntryObject {
  [key: string]: string;
}

module.exports = {
  entry: glob
    .sync("./src/**/index.ts")
    .reduce(function (obj: EntryObject, filePath: string) {
      const parentDir = path.basename(path.dirname(filePath));
      obj[parentDir] = filePath;
      return obj;
    }, {}),
  target: 'node',
  mode: 'development',
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: [
    // List here all dependencies available on the Autotask environment
    /axios/,
    /apollo-client/,
    /defender-[^\-]+-client/,
    /ethers/,
    /web3/,
    /@ethersproject\/.*/,
    /aws-sdk/,
    /aws-sdk\/.*/,
  ],
  externalsType: 'commonjs2',
  plugins: [
    // List here all dependencies that are not run in the Autotask environment
    new webpack.IgnorePlugin({ resourceRegExp: /dotenv/ }),
  ],
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/index.js",
    libraryTarget: "commonjs2"
  },
};