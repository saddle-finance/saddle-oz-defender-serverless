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
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/index.js",
    libraryTarget: "commonjs2"
  },
  target: "node",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    usedExports: true,
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  mode: "production",
  externals: {
    ethers: "commonjs2 ethers",
    "defender-relay-client": "commonjs2 defender-relay-client",
    "@ethersproject/providers": "commonjs2 @ethersproject/providers",
  },
};

// module.exports = {
//   entry: glob
//     .sync("./src/**/index.ts")
//     .reduce(function (obj: EntryObject, filePath: string) {
//       const parentDir = path.basename(path.dirname(filePath));
//       obj[parentDir] = filePath;
//       return obj;
//     }, {}),
//   target: 'node',
//   mode: 'production',
//   devtool: 'cheap-module-source-map',
//   module: {
//     rules: [
//       { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
//     ],
//   },
//   resolve: {
//     extensions: ['.tsx', '.ts', '.js'],
//   },
//   externals: [
//     /defender-relay-client/,
//     /ethers/,
//     /@ethersproject\/.*/,
//   ],
//   externalsType: 'commonjs2',
//   plugins: [
//     // List here all dependencies that are not run in the Autotask environment
//     new webpack.IgnorePlugin({ resourceRegExp: /dotenv/ }),
//   ],
//   optimization: {
//     usedExports: true,
//   },
//   output: {
//     path: path.resolve(__dirname, "dist"),
//     filename: "[name]/index.js",
//     libraryTarget: "commonjs2"
//   }
// };