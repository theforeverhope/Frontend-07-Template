学习笔记

## 单元测试工具 - Mocha
[https://mochajs.org/#getting-started]

- 安装Mocha

```shell
test$ npm install -g mocha
```

- Mocha测试代码

```javascript
// test/test.js
var assert = require('assert');

var add = require('./add.js');

describe('add function testing', function() { // grouping
  it('1+2 should be 3', function() {
    assert.equal(add(1,2), 3);
  });

  it('-5+2 should be -3', function() {
    assert.equal(add(-5,2), -3);
  });
});
```

- 带测试函数编写：add函数

```javascript
// test/add.js
function add(a, b) {
  return a + b;
}

module.exports = add;
```

- 测试Mocha

```shell
test$ mocha
```

## 单元测试 - Mocha with Babel

- 本地安装 Mocha 和 Babel 并调用

```shell
test$ npm install --save-dev mocha
test$ npm install --save-dev @babel/core @babel/register
test$ ./node_modules/.bin/mocha --require @babel/register
```

- 确定 Babel 版本

```shell
test$ npm install --save-dev @babel/preset-env
```

```json
// test/.babelrc
{
  "presets": ["@babel/preset-env"]
}
```

```javascript
// test/test.js
var assert = require('assert');

import {add} from './add.js'; // use new grammar

// ...describe 
```

```javascript
// test/add.js
export function add(a, b) {
  return a + b;
}
```

- 修改 test 命令

```json
// test/package.json
{
  // ... 
  "scripts": {
    "test": "mocha --require @babel/register"
  },
  // ... 
}
```

```shell
test$ npm run test
```

## code coverage
[https://www.npmjs.com/package/nyc]

- 安装测试覆盖率计算工具 nyc
```shell
test$ npm install --save-dev nyc
test$ nyc ./node_modules/.bin/mocha --require @babel/register
```

- 安装 nyc 支持 Babel 插件
[https://www.npmjs.com/package/@istanbuljs/nyc-config-babel]

```shell
test$ npm install --save-dev babel-plugin-istanbul
test$ npm install --save-dev babel-plugin-istanbul @istanbuljs/nyc-config-babel 
```

```json
// test/.babelrc
{
  // ...presets
  "plugins": ["istanbul"]
}
```


```json
// test/.nycrc
{
  "extends": ["@istanbuljs/nyc-config-babel"]
}
```

- 添加 coverage 计算命令

```json
// test/package.json
{
  // ... 
  "scripts": {
    // ...test
    "coverage": "nyc mocha"
  },
  // ... 
}
```


## 对 html-parser 进行单元测试

- 初始化项目

```shell
html-parser$ npm init
```

- 拷贝 test 相关配置及 .babelrc .nycrc 文件
```json
// html-parser/package.json
{
  // ...
  "scripts": {
    "test": "mocha --require @babel/register",
    "coverage": "nyc mocha"
  },
  // ...
  "devDependencies": {
    "@babel/core": "^7.13.14",
    "@babel/preset-env": "^7.13.12",
    "@babel/register": "^7.13.14",
    "@istanbuljs/nyc-config-babel": "^3.0.0",
    "babel-plugin-istanbul": "^6.0.0",
    "mocha": "^8.3.2",
    "nyc": "^15.1.0"
  }
}

```

- 安装配置

```shell
html-parser$ npm install
```

- 从 Week09 代码里拷贝 parser.js
由于parser内部实现的需要，安装css pakage。

- 编写测试 parser 覆盖率的代码
```javascript
// html-parser/test/parser-test.js
var assert = require('assert');

import {parseHTML} from '../src/parser.js'; // use new grammar with Babel

describe('parse html:', function() { // grouping
  it('<a>abc</a>', function() {
    parseHTML('<a>abc</a>');
    assert.equal(1, 1);
  });
});
```

- 测试 parser 覆盖率 coverage 是否正常运行，通过 Uncovered Line 的提示，添加测试用例，将 coverage 调整为90%以上。

```shell
html-parser$ npm run coverage
```


## generator集成

- 将 html-parser 的 test 和 coverage 与 generator 集成

```javascript
// app/index.js
var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  // ... constructor

  async initPackage() {
    // ... answers
    
    const pkgJson = {
      // ...
      "scripts": {
        "build": "webpack",
        "test": "mocha --require @babel/register",
        "coverage": "nyc mocha --require @babel/register"
      },
      // ...   
    };

    // ...   
    this.npmInstall([
      "webpack@5.5.0", 
      "webpack-cli@4.2.0", 
      "vue-loader@15.9.5", 
      "babel-loader@8.2.1", 
      "@istanbuljs/nyc-config-babel",
      "babel-plugin-istanbul",
      "@babel/core@7.12.3", 
      "@babel/preset-env@7.12.1",
      "@babel/register", 
      "mocha",
      "nyc",
      "vue-style-loader@4.1.2", 
      "css-loader@5.0.1", 
      "vue-template-compiler@2.6.12", 
      "copy-webpack-plugin@6.3.1"
    ], { 'save-dev': true });

    // ... this.fs.copyTpl
    // copy files below from folder html-parser to generator-toytool/generators/app/templates
    this.fs.copyTpl(
      this.templatePath('.babelrc'),
      this.destinationPath('.babelrc')
    );

    this.fs.copyTpl(
      this.templatePath('.nycrc'),
      this.destinationPath('.nycrc')
    );

    this.fs.copyTpl(
      this.templatePath('sample_test.js'),
      this.destinationPath('test/sample_test.js')
    );
  }
};
```

```javascript
// app/templates/sample_test.js

var assert = require('assert');

describe('test:', function() { // grouping
  it('1 + 1 == 2', function() {
    assert.equal(1 + 1, 2);
  });
});
```

- 在任意目录新建 demo 文件夹，测试生成项目，并测试 build、test、coverage 正常运行，表明 generator 能够正常工作。

```shell
generator-toytool$ npm link
demo$ yo toytool
demo$ npm run build
demo$ npm run test
demo$ npm run coverage
```



