import glob from "glob";
import path from "path";
import dotenv from "dotenv";
import webpack from "webpack";
import nodeExternals from 'webpack-node-externals';

dotenv.config();

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
    libraryTarget: "commonjs2",
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
    minimize: true, // Disable this to inspect the output better
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  mode: "production",
  externals: [
    nodeExternals({
      // List the modules you want to include in the Webpack bundled output
      allowlist: ["@cowprotocol/ts-dune-client", "ethcall", "abi-coder"],
    }),
  ],
  plugins: [
    new webpack.DefinePlugin({
      "process.env.DUNE_API_KEY": JSON.stringify(process.env.DUNE_API_KEY),
      // Add more environment variables here, if needed
    }),
  ],
};
