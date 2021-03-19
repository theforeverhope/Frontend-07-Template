module.exports = {
  entry: "./animation-demo.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: [["@babel/plugin-transform-react-jsx", {pragma: "createElement"}]] // 添加 pragma 参数
          }
        }
      }
    ]
  },
  mode: "development" // 发布时改成 "production"
}