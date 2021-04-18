学习笔记

## 初始化 server

- 在没有真实服务器的情况下，安装 Oracle VM Virtual Box 虚拟机。

Oracle VM Virtual Box[https://www.virtualbox.org/]
Ubuntu 20.04.1 LTS (Focal Fossa)[https://releases.ubuntu.com/20.04/]
Ubuntu mirror[https://mirrors.aliyun.com/ubuntu]

- 安装 node npm 初始化环境

```shell
shira$ sudo apt install nodejs
shira$ sudo apt install npm
shira$ sudo npm install -g n
shira$ sudo n latest
shira$ PATH="$PATH"
shira$ mkdir server
```


## 利用Express，编写服务器，初始化 server

```shell
Week19$ mkdir server
Week19$ cd server
Week19/server$ npx express-generator
Week19/server$ npm install
```


## 利用Express，编写服务器，部署 server
因为没有真实服务器可以使用，所以利用虚拟机代替真实服务器才需要配置端口转发，否则直接使用真实服务器端口即可。

- 配置虚拟机端口转发
Oracle VM VirtualBox 管理器 - 设置 - Node Server 网络 - 接口转发 - 主机端口 8022，子系统端口 22（将主机 8022 端口转发到虚拟机 22 端口）

- 拷贝server到虚拟机
```shell
Week19/server$ scp -P 8022 -r ./* shira@127.0.0.1:/home/shira/server
```

- 配置虚拟机上 server 3000 端口的转发
Oracle VM VirtualBox 管理器 - 设置 - Node Server 网络 - 接口转发 - 主机端口 8080，子系统端口 3000（将虚拟机 3000 端口转发到主机 8080 端口）

- 访问虚拟机上的 server: http://localhost:8080/


## 本地环境模拟实现一套发布服务：用node启动一个简单的server

- 发布服务 = 发布服务器端 + 发布工具（客户端）
通过8082端口进行数据交互。

```shell
Week19$ mkdir publish-server
Week19$ mkdir publish-tool
```

- 发布服务器端，通过 http://localhost:8082/ 访问
```shell
Week19$ cd publish-server
Week19/publish-server$ npm init
```

```javascript
// Week19/publish-server/server.js
let http = require("http");

http.createServer(function(req, res) {
    console.log(req);
    res.end("HTTP Server: Hello World");
}).listen(8082);
```

```shell
Week19/publish-server$ node ./server.js
```

- 发布工具
```shell
Week19$ cd publish-tool
Week19/publish-tool$ npm init
```

```javascript
// Week19/publish-tool/publish.js
let http = require("http");

let request = http.request({
  hostname: "127.0.0.1",
  port: 8082
}, response => {
  console.log(response);
});

request.end();
```

```shell
Week19/publish-tool$ node ./publish.js
```

  
## 本地环境模拟实现一套发布服务：简单了解Node.js的流
[https://nodejs.org/docs/latest-v13.x/api/stream.html#stream_class_stream_readable]

- 测试 read 流

```javascript
// Week19/publish-tool/publish.js
let fs = require("fs");

let file = fs.createReadStream('./package.json');

file.on('data', chunk => {
  console.log(chunk.toString());
})

file.on('end', chunk => {
  console.log('read finished');
})
```

```shell
Week19/publish-tool$ node ./publish.js
```

- 发布工具传输流文件
```javascript
// Week19/publish-tool/publish.js

let http = require("http");
let fs = require("fs");

let request = http.request({
  hostname: "127.0.0.1",
  port: 8082,
  method: "POST",
  headers: {
    "Content-Type": "application/octet-stream"
  }
}, response => {
  console.log(response);
});

let file = fs.createReadStream('./package.json');

file.on('data', chunk => {
  console.log(chunk.toString());
  request.write(chunk);
})

file.on('end', chunk => {
  console.log('read finished');
  request.end(chunk);
})
```

- 发布服务器接收流文件
```javascript
// Week19/publish-server/server.js
let http = require("http");

http.createServer(function (req, res) {
  req.on('data', chunk => {
    console.log(chunk.toString());
  })

  req.on('end', chunk => {
    res.end("Success");
  })
  
}).listen(8082);
```


## 本地环境模拟实现一套发布服务：改造 server

- 改造 server 和 publisher
```javascript
// Week19/publish-server/server.js
let http = require("http");
let fs = require("fs");

http.createServer(function (req, res) {
  let outFile = fs.createWriteStream("../server/public/index.html")；

  req.on('data', chunk => {
    outFile.write(chunk);
  })

  req.on('end', () => {
    outFile.end();
    res.end("Success");
  })
  
}).listen(8082);
```

```javascript
// Week19/publish-tool/publish.js
// ...request

let file = fs.createReadStream('./sample.html');

// ...file.on
```

- 验证 server

Week19/server， 用 npm start 运行 server，server 运行在 3000 端口，访问本地环境 http://localhost:3000/ 看到 sample.html 的代码在拷贝到 Week19/server/public/index.html 之后运行成功。


## 将本地发布系统的发布服务器部分部署到虚拟机，发布工具仅需运行在客户端。

- 为发布系统配置命令

Week19/publish-server/package.json, 仅添加 scripts 命令。
```json
{

  "scripts": {
    "start": "node ./server.js",
    "publish": "scp -P 8022 -r ./* shira@127.0.0.1:/home/shira/publish-server",
  },

}
```

Week19/server/package.json, 仅添加 scripts 命令。
```json
{

  "scripts": {
    "start": "node ./bin/www",
    "publish": "scp -P 8022 -r ./* shira@127.0.0.1:/home/shira/server"
  },

}
```

- 在虚拟机上新建publish-server文件夹，将本地发布系统上传至虚拟机（也就是正式发布服务器），需要输入虚拟机密码才能成功传输。

```shell
shira$ mkdir publish-server
```

```shell
Week19/server$ npm run publish
Week19/publish-server$ npm run publish
```

- 在虚拟机上运行发布系统的两个 server

```shell
shira/server$ npm start&
shira/publish-server$ npm start&
```

- 由于发布服务器在虚拟机上仍然监听 8082 端口，所以需要配置虚拟机转发客户端（8882）发布工具的数据到虚拟机（8082）发布服务器端。将客户端发送数据的端口修改为 8882。

```javascript
// Week19/publish-tool/publish.js
// ...
let request = http.request({
  hostname: "127.0.0.1",
  // port: 8082, // 访问客户端模拟发布服务器（8082）
  port: 8882, // 访问虚拟机: 客户端发布工具（8882） to 虚拟机发布服务器（8082）
  method: "POST",
  headers: {
    "Content-Type": "application/octet-stream"
  }
}, response => {
  console.log(response);
});
// ...
```


## 利用本地发布系统模拟实现多文件发布

- 将文件流放入请求流使用 pipe

```javascript
// Week19/publish-tool/publish.js
// ...
file.pipe(request);
file.on('end', () => request.end());
// ...
```

```javascript
// Week19/publish-server/server.js
// ...
http.createServer(function (req, res) {
  let outFile = fs.createWriteStream("../server/public/index.html");
  req.pipe(outFile)
}).listen(8082);
```

- 单文件传输示例：获取文件大小，放入请求 Content-Type 便于压缩后解压缩。

```javascript
// Week19/publish-tool/publish.js
// ...
const filePath = "./sample.html";

fs.stat(filePath, (err, state) => {
  let request = http.request({
    hostname: "127.0.0.1",
    port: 8082, // 访问客户端模拟发布服务器（8082）
    // port: 8882, // 访问虚拟机(模拟线上服务器)转发请求 客户端发布工具（8882） 到 虚拟机发布服务器（8082）
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": state.size
    }
  }, response => {
    console.log(response);
  });

  let file = fs.createReadStream(filePath);
  file.pipe(request);
  file.on('end', () => request.end());
})
// ...
```

- 多文件传输示例：利用 archiver 压缩，后用 unzipper 解压缩。
  - 发布工具端：安装压缩包 archiver，压缩文件夹发送到服务器端。
  [https://www.npmjs.com/package/archiver]
  ```shell
  Week19/publish-tool$ npm install --save archiver
  ```

  ```javascript
  let http = require("http");
  let archiver = require("archiver");

  const folderPath = "../sample/";

  let request = http.request({
    hostname: "127.0.0.1",
    port: 8082, // 访问客户端模拟发布服务器（8082）
    // port: 8882, // 访问虚拟机(模拟线上服务器)转发请求 客户端发布工具（8882） 到 虚拟机发布服务器（8082）
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    }
  }, response => {
    console.log(response);
  });

  const archive = archiver("zip", { 
    zlib: { level: 9 } // sets the compression level
  })
  archive.directory(folderPath, false);
  archive.finalize();
  archive.pipe(request);
  ```

  - 发布服务器端：安装解压缩包 unzipper，解压发布工具发布来的文件。
  [https://www.npmjs.com/package/unzipper]
  ```shell
  Week19/publish-server$ npm install --save unzipper
  ```

  ```javascript
  // ...
  let http = require("http");
  let unzipper = require("unzipper")

  http.createServer(function (req, res) {
    req.pipe(unzipper.Extract({ path: "../server/public/" }));
  }).listen(8082);
  ```

  - 运行 发布服务器端 和 发布工具端 验证发布效果。


## 用 GitHub oAuth 做一个登陆示例
参考官方文档[http://developer.github.com/apps/building-oauth-apps/authorizing-oauth-apps]

- 创建登陆权限
  - Settings -> Developer Settings -> Register new GitHub App
  - GitHub App name: shira-toy-publish
  - Homepage URL: http://127.0.0.1
  - Callback URL: http://127.0.0.1:8082/auth
  - Expire user authorization tokens: no (用户登陆态不需要过期，我们的安全性要求不高)
  - Webhook: not active
  - Where can this GitHub App be installed?: Any account
  - Create GitHub App

- 编写发布服务器 server 代码

```javascript
//  Week19/publish-server/server.js
let http = require("http");
let https = require("https");
// let fs = require("fs");
let unzipper = require("unzipper");
let qs = require("querystring");

// 2. auth路由：接收 code，用 code+client_id+client_secret 换 token
function auth(request, response) {
  let query = request.url.match(/^\/auth\?([\s\S]+)$/)
  let parsed_query = query && query.length > 1 ? qs.parse(query[1]) : {}
  
  if (parsed_query.code) {
    getToken(parsed_query.code, (res) => {
      console.log('access_token object:', res)
      response.write(`<a href="http://127.0.0.1:8083/token=${res.access_token}">Publish</a>`);
      response.end();
    })
  }
}

function getToken(code, callback) {
  console.log('code:', code)
  let request = https.request({
    hostname: "github.com",
    path: `/login/oauth/access_token?code=${code}&client_id=Iv1.05093a459674df0b&client_secret=70989eb7e436545a76b000f127ef0471568da731`,
    port: 443,
    method: "POST",
  }, function(response) {
    let body = "";
    response.on('data', chunk => {
      body += chunk.toString();
    });

    response.on('end', () => {
      callback(qs.parse(body))
    });
  })

  request.end();
}

// 4. publish路由：用 token 获取用户信息，检查权限，接受发布
function publish(request, response) {
  let query = request.url.match(/^\/publish\?([\s\S]+)$/)
  let parsed_query = query && query.length > 1 ? qs.parse(query[1]) : {}

  if (parsed_query.token) {
    getUser(parsed_query.token, (res) => {
      console.log('login user:', res)
      if (res.login === "shira") {
        request.pipe(unzipper.Extract({ path: "../server/public/" }));
        request.on('end', () => {
          response.end('Success!');
        })
      } 
    });
  }
}

function getUser(token, callback) {
  let request = https.request({
    hostname: "api.github.com",
    path: "/user",
    port: 443,
    method: "GET",
    headers: {
      "Authorization": `token ${token}`,
      "User-Agent": "shira-toy-publish"
    }
  }, function(response) {
    let body = "";
    response.on('data', chunk => {
      body += chunk.toString();
    });

    response.on('end', () => {
      callback(JSON.parse(body));
    });
  })

  request.end();
}

http.createServer(function (req, res) {
  if (req.url.match(/^\/auth\?/)) {
    return auth(req, res);
  } else if (req.url.match(/^\/publish\?/)) {
    return publish(req, res);
  }
}).listen(8082);
```

- 编写发布工具代码


```javascript
//  Week19/publish-tool/publish.js
let http = require("http");
let fs = require("fs");
let archiver = require("archiver");
let child_process = require("child_process");
let qs = require("querystring");

// 1. 打开 https://github.com/login/oauth/authorize
child_process.exec(`open https://github.com/login/oauth/authorize?client_id=Iv1.05093a459674df0b&`);

// 3. 创建 server，接收 token，后点击发布
http.createServer(function (request, response) {
  let query = request.url.match(/^\/\?([\s\S]+)$/)
  let parsed_query = query && query.length > 1 ? qs.parse(query[1]) : {}
  publish(parsed_query.token)
}).listen(8083);

function publish(token) {
  const folderPath = "../sample/";

  let request = http.request({
    hostname: "127.0.0.1",
    port: 8082, // 访问客户端模拟发布服务器（8082）
    // port: 8882, // 访问虚拟机(模拟线上服务器)转发请求 客户端发布工具（8882） 到 虚拟机发布服务器（8082）
    path: `/publish?token=${token}`,
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
    }
  }, response => {
    console.log('tool publish response:', response);
  });

  const archive = archiver("zip", { 
    zlib: { level: 9 } // sets the compression level
  })
  archive.directory(folderPath, false);
  archive.finalize();
  archive.pipe(request);
}

```