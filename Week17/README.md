学习笔记

## 初始化工具 Yeoman

- 安装 yo@3.1.1 + yeoman-generator@4.13.0 + yeoman-environment@3.0.0
（由于最新版本的 yeoman-generator 和 yeoman-environment 的版本不兼容，所以为了安装 4.13.0 版本的 yeoman-generator。）

```shell
$ mkdir toolchain
$ npm init
$ npm install -g yo
$ npm install yeoman-generator@4.13.0
```

- 初始化 generators 例: toolchain
用 yo toolchain 运行 generators，看到打印结果表示 toolchain 正常运行。

```javascript
// generators/app/index.js

var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);

    // Next, add your custom code
    this.option('babel'); // This method adds support for a `--babel` flag
  }

  method1() {
    this.log("run method1");
  }

  method2() {
    this.log("run method2");
  }
};
```

- 实现与用户交互
Yeomen用户交互：[https://yeoman.io/authoring/user-interactions.html]

```javascript
// generators/app/index.js

var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // ... constructor

  async method1() {
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      },
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?"
      }
    ]);

    this.log("app name", answers.name);
    this.log("cool feature", answers.cool);
  }
};
```

- 实现拷贝模版
Yeomen文件系统：[https://yeoman.io/authoring/file-system.html]

```html
<!-- generators/templates/index.html -->

<html>
  <head>
    <title><%= title %></title>
  </head>
</html>
```

```javascript
// generators/app/index.js

var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // ... constructor

  initPackage() {
    const pkgJson = {
      devDependencies: {
        eslint: '^3.15.0'
      },
      dependencies: {
        react: '^16.2.0'
      }
    };

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
    this.npmInstall();
  }

  async step1() {
    this.fs.copyTpl(
      this.templatePath('index.html'),
      this.destinationPath('public/index.html'),
      { title: 'Templating with Yeoman' }
    );
  }
};
```

- 实现生成依赖文件并安装依赖
Yeomen依赖系统：[https://yeoman.io/authoring/dependencies.html]

```javascript
// generators/app/index.js

var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // ... constructor

  initPackage() {
    const pkgJson = {
      devDependencies: {
        eslint: '^3.15.0'
      },
      dependencies: {
        react: '^16.2.0'
      }
    };

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
    this.npmInstall();
  }
};
```


# 构建 VUE Generator

- 构建 Generator
这里需要安装 vue-loader@next，也就是最新版本的 vue-loader 及其依赖 @vue/compiler-sfc，生成的模版 webpack才能正常运行。

```javascript
// generator-vue/generators/app/index.js

var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);

    // Next, add your custom code
    this.option('babel'); // This method adds support for a `--babel` flag
  }

  async initPackage() {
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      }
    ]);
    
    const pkgJson = {
      "name": answers.name,
      "version": "1.0.0",
      "description": "",
      "main": "generator/app/index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "author": "",
      "license": "ISC",
      "dependencies": {
        "yeoman-environment": "^3.0.0",
        "yeoman-generator": "^4.13.0",
        "yo": "^3.1.1"
      }
    };    

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
    this.npmInstall(["vue"], { 'save-dev': false });
    this.npmInstall(["webpack@4.44.1", "vue-loader", "vue-loader@next", "@vue/compiler-sfc", "vue-style-loader", 
      "css-loader", "vue-template-compiler"], { 'save-dev': true });
  }

  copyFiles() {
    this.fs.copyTpl(
      this.templatePath('HelloWorld.vue'),
      this.destinationPath('src/HelloWorld.vue'),
    );

    this.fs.copyTpl(
      this.templatePath('webpack.config.js'),
      this.destinationPath('src/webpack.config.js'),
    );

    this.fs.copyTpl(
      this.templatePath('main.js'),
      this.destinationPath('src/main.js'),
    );
  }
};
```

- HelloWorld.vue模版 
[https://cn.vuejs.org/v2/guide/single-file-components.html]<br>

```vue
<template>
  <p>{{ greeting }} World!</p>
</template>

<script>
module.exports = {
  data: function() {
    return {
      greeting: "Hello"
    };
  }
};
</script>

<style scoped>
p {
  font-size: 2em;
  text-align: center;
}
</style>
```

- webpack.config.js模版（包含entry、vue-loader、vue-style-loader、css-loader|） 
[https://www.webpackjs.com/concepts/#loader]<br>
[https://vue-loader.vuejs.org/guide/#manual-setup]<br>

```javascript
const webpack = require('webpack'); // 用于访问内置插件
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const config = {
  entry: "./src/main.js",
  module: {
    rules: [
      { 
        test: /\.vue$/, 
        use: 'vue-loader' 
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
    new VueLoaderPlugin()
  ]
};

module.exports = config;
```

- 主入口文件main.js模版

```javascript
import HelloWorld from './HelloWorld.vue';
```

- webpack copy plugin 安装
[https://www.webpackjs.com/plugins/copy-webpack-plugin/]
```javascript
// generator-vue/generators/app/templates/webpack.config.js

// ...
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  // ...
  plugins: [
    //...
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/*.html', to: '[name].[ext]' },
      ]
    })
  ],
};

module.exports = config;
```

```javascript
// generator-vue/generators/app/index.js
async initPackage() {
  // ...
  this.npmInstall(["webpack@4.44.1", "vue-loader", "vue-loader@next", "@vue/compiler-sfc", "vue-style-loader", "css-loader", "vue-template-compiler", "copy-webpack-plugin"], { 'save-dev': true });
}
```

- 完善VUE页面

```javascript
// generator-vue/generators/app/templates/main.js

import Vue from 'vue';
import HelloWorld from './HelloWorld.vue';

new Vue({
  el: '#app',
  render: h => h(HelloWorld)
})
```

```html
<!-- generator-vue/generators/app/templates/index.html -->
<html>
  <head>
    <title><%= title %></title>
  </head>

  <body>
    <div id="app"></div>
    <script src="./main.js"></script>
  </body>
</html>
```