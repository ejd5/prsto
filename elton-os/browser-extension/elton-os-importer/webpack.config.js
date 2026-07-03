const path = require("path");

module.exports = {
  entry: {
    popup: "./src/popup.ts",
    background: "./src/background.ts",
    "post-apply-detector": "./src/post-apply-detector.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: { transpileOnly: true },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
