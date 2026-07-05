const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: {
      background: "./src/background/index.ts",
      "content-linkedin": "./src/content/platforms/linkedin.ts",
      "content-indeed": "./src/content/platforms/indeed.ts",
      "content-apec": "./src/content/platforms/apec.ts",
      "content-cadremploi": "./src/content/platforms/cadremploi.ts",
      "content-wttj": "./src/content/platforms/wttj.ts",
      sidepanel: "./src/sidepanel/index.tsx",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
      publicPath: "",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/sidepanel/index.html",
        filename: "sidepanel.html",
        chunks: ["sidepanel"],
        inject: "body",
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "manifest.json",
            to: "manifest.json",
          },
          {
            from: "icons",
            to: "icons",
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    optimization: {
      splitChunks: false,
    },
    devtool: isProd ? false : "source-map",
    performance: {
      hints: false,
    },
  };
};
