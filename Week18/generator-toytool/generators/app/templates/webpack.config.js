const webpack = require('webpack'); // 用于访问内置插件
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  entry: "./src/main.js",
  module: {
    rules: [
      { 
        test: /\.vue$/, 
        loader: 'vue-loader' 
      },
      { 
        test: /\.js$/, 
        loader: 'babel-loader',
        options: {
          presets: ["@babel/preset-env"]
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/*.html', to: '[name][ext]' },
      ]
    })
  ],
  mode: "development"
};

module.exports = config;