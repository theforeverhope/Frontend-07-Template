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

  // const filePath = './sample.html';

  let request = http.request({
    hostname: "127.0.0.1",
    port: 8082, // 访问客户端模拟发布服务器（8082）
    // port: 8882, // 访问虚拟机(模拟线上服务器)转发请求 客户端发布工具（8882） 到 虚拟机发布服务器（8082）
    path: `/publish?token=${token}`,
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      // "Content-Length": state.size
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
  
// file.on('data', chunk => {
//   console.log(chunk.toString());
//   request.write(chunk);
// })

// file.on('end', chunk => {
//   console.log('read finished');
//   request.end(chunk);
// })
}
