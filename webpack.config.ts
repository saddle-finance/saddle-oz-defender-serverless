import glob from "glob";
import path from "path";
import TerserPlugin from "terser-webpack-plugin";
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
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: true, // don't change function names
          keep_classnames: true, // don't change class names
          compress: {
            dead_code: true,
            drop_console: false,
            drop_debugger: true,
          },
          output: {
            comments: false,
            beautify: true,
          },
        },
      }),
    ],
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
