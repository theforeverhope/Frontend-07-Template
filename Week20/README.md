学习笔记

## 持续集成
概念源生于客户端的构建比较耗时，所以需要对于构建过程进行校验。如果校验不通过，那么这次构建就是失败的，则不需要完成此次构建既可以报错构建失败。

BVT = build verification test 构建验证测试（优点是验证了软件的基本功能。缺点是该种测试的覆盖率很低。）

- 通过重写 Hooks 锁定在持续集成过程中检查的时机。
- 使用 ESLint 实现轻量级检查方案，对代码风格和常见代码模式进行校验。
- 基于无头浏览器 Chrome Headless 对生成的代码进行规则校验和检查。

## Git Hooks 基本用法 

- 获取 git hooks

```shell
Week20$ mkdir git-demo
Week20$ cd git-demo
Week20/git-demo$ touch README.md
Week20/git-demo$ git init
Week20/git-demo$ git add README.md
Week20/git-demo$ git commit -a -m "init"
Week20/git-demo$ open ./
```
在 .git 文件目录下是所有的 [ git-hooks-name ].sample 文件

- 用 node 执行 hooks

编写用例测试 node 是否执行了 hooks 中的 .pre-commit 文件
```javascript
// Week20/git-demo/.git/hooks/.pre-commit

// 配置可使用的 node 地址在此引用 node 运行下面的代码
#!/usr/bin/env node 
console.log("Hello, hooks!")
```

```shell
Week20/git-demo$ cd .git/hooks
Week20/git-demo/.git/hooks$ chmod +x ./pre-commit
Week20/git-demo/.git/hooks$ node ./pre-commit
```

- Git 自动执行 hooks
测试 Git 自动调用我们重写的 pre-commit hooks，在 git-demo/README.md 文件写入内容（内容不限，这里就是为了 commit 提交的时候观察是否调用了我们重写的 ./pre-commit 文件，看到 console.log 的内容即表明调用 ./pre-commit 成功）

```text
# A Sample Change
```

```shell
Week20/git-demo$ git add .
Week20/git-demo$ git commit -m "A sample change"
Week20/git-demo$
```

- 中断 Git 提交

```javascript
// Week20/git-demo/.git/hooks/.pre-commit

// 配置可使用的 node 地址在此引用 node 运行下面的代码
#!/usr/bin/env node 
let process = require("process");

console.log("Hello, hooks!")
process.exitCode = 1; // 这样可以中断 Git 提交
```

## ESLint 基本用法 
ESLint 官网：[https://eslint.org/]

- 安装 eslint

```shell
Week20$ mkdir eslint-demo
Week20$ cd eslint-demo
Week20/eslint-demo$ npm init
Week20/eslint-demo$ npm install --save-dev eslint
Week20/eslint-demo$ npx eslint --init
```

- 测试 eslint

```javascript
// Week20/eslint-demo/index.js 新建文件随意写一些内容

let a = 1;
for (let i of [1, 2, 3]) {
    console.log(i);
}
```

运行 eslint 观察到其检测到：error  'a' is assigned a value but never used
```shell
Week20/eslint-demo$ npx eslint ./index.js
```


## ESLint API及其高级用法
ESLint 的 NodeJS API：[https://eslint.org/docs/developer-guide/nodejs-api] (使用 an example that autofixes lint problems 部分的代码)

- 重写 pre-commit hooks 在检测到 ESLint 错误时中断提交
```javascript
// Week20/git-demo/.git/hooks/.pre-commit

#!/usr/bin/env node 
let process = require("process");
const { ESLint } = require("eslint");

(async function main() {
  // 1. Create an instance with the `fix` option.
  const eslint = new ESLint({ fix: true });

  // 2. Lint files. This doesn't modify target files.
  const results = await eslint.lintFiles(["index.js"]); // 这里换成准备好的测试代码文件地址

  // 4. Format the results.
  const formatter = await eslint.loadFormatter("stylish");
  const resultText = formatter.format(results);

  // 5. Output it.
  console.log(resultText);

  for (let result of results) {
    if (result.errorCount) {
      process.exitCode = 1; // 检测到 ESLint 报错则中止提交 Git
    }
  }
})().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
```

- 编写测试用例，初始化项目
在 git-demo 文件夹下初始化项目，安装并配置 ESLint。

```shell
Week20$ cd git-demo
Week20/git-demo$ npm init
Week20/git-demo$ npm install --save-dev eslint
Week20/git-demo$ npx eslint --init
```

- 编写测试用例，准备测试代码
```javascript
// Week20/git-demo/index.js 新建文件随意写一些内容

let a; // 去掉这一行代码，git commit 即可成功提交
for (let i of [1, 2, 3]) {
    console.log(i);
}
```

- 在 git_demo 文件夹里新建 .gitignore 目录写入内容 node_modules，以免提交大量的 node_modules 变更到 Git 仓库。

- 测试 ESLint error 阻止 Git commit 提交
观察到 git commit 前后 git status 不变，文件没有被提交。
```shell
Week20/git-demo$ git add .
Week20/git-demo$ git commit -m "add index.js"
Week20/git-demo$ git status
```

- 解决 Git 提交的版本，和 ESLint 检测版本不同的问题。
当对文件进行了两次修改 version_1 和 version_2，但只用 git add 记录了一次修改，那么对于 git 而言只能提交第一次的修改 version_1，而 ESLint 会检查第二次修改的代码 version_2，导致检查的代码和将要提交的代码版本不一致。
CASE：
```shell
Week20/git-demo$ git add .
Week20/git-demo$ git commit -m "version_1"
Week20/git-demo$ git commit -m "version_2"
```
解决方案使用 git stash push 先将 version_2 的代码缓存在堆栈里不使用，ESLint就会只检测 version_1 的代码。
```shell
Week20/git-demo$ git add .
Week20/git-demo$ git commit -m "version_1"
Week20/git-demo$ git commit -m "version_2"
Week20/git-demo$ git stash push -k
```
之后要使用 version_2 的代码时再使用 git stash pop 出栈即可。

- 用 child_process 库代替用户来执行 git stash push 过程。

```javascript
// Week20/git-demo/.git/hooks/.pre-commit

#!/usr/bin/env node
// ...
let child_process = require("child_process");

function exec(name) {
  return Promise(function (resolve) {
    child_process.exec(name, resolve);
  })
}

(async function main() {
  // ...

  // 2. Lint files. This doesn't modify target files.
  await exec("git stash push -k");
  const results = await eslint.lintFiles(["index.js"]); // 这里换成准备好的测试代码文件地址
  await exec("git stash pop");

  // ...
})().catch((error) => {
  // ...
});
```


## 使用无头浏览器检查 DOM
[https://developers.google.com/web/updates/2017/04/headless-chrome]
[https://www.npmjs.com/package/puppeteer/v/1.11.0-next.1547527073587]

- 安装 puppeteer - Chrome 无头浏览器插件

```shell
Week20$ mkdir headless-demo
Week20$ cd headless-demo
Week20/headless-demo$ touch main.js
Week20/headless-demo$ npm init
Week20/headless-demo$ npm install --save-dev puppeteer
```

- 测试无头浏览器

```javascript
const puppeteer = require('puppeteer');
 
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/main.html'); // 这里写自己项目的地址
  
  const a = await page.$("a"); // 解析项目中的 Dom 树
  const img = await page.$$("a"); // 解析项目中的 Dom 树
 
  console.log(a.asElement().boxModel(), img); // 打印观察结果
})();
```