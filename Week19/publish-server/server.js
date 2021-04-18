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