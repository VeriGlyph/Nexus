const webpack = require("webpack");

const { defineConfig } = require("@vue/cli-service");
// const { webpack } = require("webpack");

module.exports = defineConfig({
  configureWebpack: {
    resolve: {
      modules: ["src", "node_modules"],
      extensions: [".ts", ".js"],
      fallback: {
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
      }),
    ],
    // node: {
    //   Buffer: true,
    // },
  },
  transpileDependencies: ["vuetify"],
});
