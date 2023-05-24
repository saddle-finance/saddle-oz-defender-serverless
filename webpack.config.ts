import glob from "glob";
import path from "path";

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