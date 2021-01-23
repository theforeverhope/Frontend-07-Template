学习笔记

## Browser

URL -HTTP-> HTML -parse-> DOM -CSS computing-> DOM with CSS -layout-> DOM with position -render-> Bitmap


## Finite State Machine(FSM)

- Moore: 每个机器都有确定的下一个状态
- Mealy: 每个机器根据输入决定下一个状态


## IOS-OSI 七层网络模型

- 应用    - HTTP
- 表示    - HTTP
- 会话    - HTTP: require("http")
- 传输    - TCP/IP: require("net")
- 网络    - Internet
- 数据链路 - 4G/5G/WIFI
- 物理层   - 4G/5G/WIFI


## HTTP Request

POST / HTTP/1.1  (Request Line: Method Path Protocol)<br>
Host: 127.0.0.1  (Headers: multiple lines end with an empty line.)<br>
Content-Type: application/x-www-form-urlencoded<br>

field1=aaa&code=x%3D1 (Body: write in the format of Content-Type)<br>


## HTTP Response

HTTP/1.1 200 OK          (Status Line: Protocol StatusCode StatusText)<br>
Content-Type: text/html  (Headers: multiple lines end with an empty line.)<br>
Date: Mon, 23 Dec 2019 06:46:19 GMT<br>
Connection: keep-alive<br>
Transfer-Encoding: chunked<br>

26<br>                   (Body: chunked body start with a number and end with 0.)
&#60html>&#60body>&#60/body>&#60/html><br>
0<br>


## Toy Browser

- Request
  根据上文 HTTP Request 结构设计API，并实现 Request 类。<br>
  在 Request 构造器里收集必要信息，用 send 函数将收集到信息构建出的请求发送到服务器（server.js）。<br>
  send 函数是异步的，所以使用 Promise 实现。<br>

```javascript
const net = require("net");

class Request {
  constructor(options) {
    this.method = options.method || "GET";
    this.host = options.host || "127.0.0.1";
    this.port = options.port || "8080";
    this.path = options.path || "/";
    this.headers = options.headers || {};
    this.body = options.body || {};

    if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
      this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join("&");
    } else if (headers["Content-Type"] === "application/json") {
      this.bodyText = JSON.stringify(this.body);
    }

    this.headers["Content-Length"] = this.bodyText.length;
  }

  send() {
    return new Promise((resolve, reject) => {});
  }
}

void async function () {
  let request = new Request({
    method: "POST",     // HTTP
    host: "127.0.0.1",  // IP
    port: "8088",       // TCP
    path: "/",          // HTTP
    headers: {          // HTTP
      ["X-Foo2"]: "customed"
    },
    body: {             // HTTP
      name: "Shira",
      date: "2021.01.17"
    }
  });

  let response = await request.send();
  console.log(response);
}();
```

- Response
  编写 send 函数，由于 Response 会逐步接收信息再构建，所以我们需要一个 ResponseParser。<br>
  支持已有的 connection 或 自己新建 connection<br>
  收到数据传给 parser<br>
  根据 parser 返回的状态来判断完成时刻<br>
  特别注意！！！toSring的每一行前面不能有多余的空格，会影响报文格式，导致解析错误！<br>

```javascript
class Request {
  // ... constructor ...

  // construct request content
  // each line can not has space in the front of line!!!
  toString() {
    return `${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join("\r\n")}\r
\r
${this.bodyText}
`;
  }

  send(connection) {
    return new Promise((resolve, reject) => {
      const parser = new ResponseParser();
      if (connection) {
        // if has connection, then use it to send request content.
        connection.write(this.toString());
      } else {
        // if has not connection, then create one to send request content.
        connection = net.createConnection({
          host: this.host,
          port: this.port
        }, () => {
          connection.write(this.toString());
        });
      }

      connection.on("data", data => {
        console.log(data.toString())
        parser.receive(data.toString());
        if (parser.isFinished) {
          resolve(parser.response);
          connection.end();
        }
      });

      connection.on("error", err => {
        reject(err);
        connection.end();
      });
    });
  }
}

class ResponseParser {
  constructor() {}
  receive(string) {}
  receiveCharactor(charactor) {}
}
```

- Response Parser
  用状态机来分析文本结构，根据 HTTP Response 的结构来实现 parser 的状态机。<br>

```javascript
class ResponseParser {
  constructor() {
    this.WAITING_STATUS_LINE = 0;
    this.WAITING_STATUS_LINE_END = 1;
    this.WAITING_HEADER_NAME = 2;
    this.WAITING_HEADER_SPACE = 3;
    this.WAITING_HEADER_VALUE = 4;
    this.WAITING_HEADER_LINE_END = 5;
    this.WAITING_HEADER_BLOCK_END = 6;
    this.WAITING_BODY = 7;

    this.current = this.WAITING_STATUS_LINE;

    this.statusLine = "";

    this.headers = {};
    this.headerName = "";
    this.headerValue = "";

    this.bodyParser = null;
  }

  receive(string) {
    for (let i = 0; i < string.length; i++) {
      this.receiveCharactor(string.charAt(i));
    }
  }

  receiveCharactor(charactor) {
    if (this.current === this.WAITING_STATUS_LINE) {
      // construct statusLine
      if (charactor === '\r') {
        this.current = this.WAITING_STATUS_LINE_END;
      } else {
        this.statusLine += charactor;
      }
    } else if (this.current === this.WAITING_STATUS_LINE_END) {
      // check the end of statusLine
      if (charactor === '\n') {
        this.current = this.WAITING_HEADER_NAME;
      }
    } else if (this.current === this.WAITING_HEADER_NAME) {
      // separate name and value of a header with ':'
      // check the whole headers content end with '\r'
      if (charactor === ':') {
        this.current = this.WAITING_HEADER_SPACE;
      } else if (charactor === '\r') {
        this.current = this.WAITING_HEADER_BLOCK_END;
      } else {
        // collect a headers name
        this.headerName += charactor;
      }
    } else if (this.current === this.WAITING_HEADER_SPACE) {
      // check the begin of header value
      if (charactor === ' ') {
        this.current = this.WAITING_HEADER_VALUE;
      }
    } else if (this.current === this.WAITING_HEADER_VALUE) {
      // 
      if (charactor === '\r') {
        this.current === this.WAITING_HEADER_LINE_END;
        // save a headers line with headerName and headerValue
        this.headers[this.headerName] = this.headerValue;
        // initial them to collect next headers line
        this.headerName = "";
        this.headerValue = "";
      } else {
        // collect a headers value
        this.headerValue += charactor;
      }
    } else if (this.current === this.WAITING_HEADER_LINE_END) {
      // check the end of a headers line
      if (charactor === '\n') {
        this.current = this.WAITING_HEADER_NAME;
      }
    } else if (this.current === this.WAITING_HEADER_BLOCK_END) {
      // check the end of headers content
      if (charactor === '\n') {
        this.current = this.WAITING_BODY;
      }
    } else if (this.current === this.WAITING_BODY) {
      console.log(charactor);
    }
  }
}
```

- Body Parser 
  Response body 会因为 Content-Type 的不同有不同的结构，因此我们需要用子parser的结构来解决问题。<br>
  以 ThunkedBodyParser 为例，用状态机实现 Body Parser。<br>

```javascript
class ResponseParser {
  // ... constructor ...

  get isFinished() {
    return this.bodyParser && this.bodyParser.isFinished;
  }

  get response() {
    this.statusLine.match(/HTTP\/1.1 ([0-9]+) ([\s\S]+)/);
    return {
      statusCode: RegExp.$1,
      statusText: RegExp.$2,
      headers: this.headers,
      body: this.bodyParser.content.join("")
    }
  }

  // ... receive ...
  // ... receiveCharactor ...
}

class ThunkedBodyParser {
  constructor() {
    this.WAITING_LENGTH = 0;
    this.WAITING_LENGTH_LINE_END = 1;
    this.READING_TRUNK = 2;
    this.WAITING_NEW_LINE = 3;
    this.WAITING_NEW_LINE_END = 4;
    
    this.length = 0;
    this.content = [];
    this.isFinished = false;
    this.current = this.WAITING_LENGTH;
  }

  receiveCharactor(charactor) {
    if (this.current === this.WAITING_LENGTH) {
      if (charactor === '\r') {
        if (this.length === 0) {
          this.isFinished = true;
        }
        this.current = this.WAITING_LENGTH_LINE_END;
      } else {
        // the first line in chunk body is a number in hexadecimal
        // this line called length line
        this.length *= 16;
        this.length += parseInt(charactor, 16);
      }
    } else if (this.current === this.WAITING_LENGTH_LINE_END) {
      // check the end of length line
      if (charactor === '\n') {
        this.current = this.READING_TRUNK;
      }
    } else if (this.current === this.READING_TRUNK) {
      // collect each line of chunk in content
      this.content.push(charactor);
      this.length --;
      if (this.length === 0) {
        this.current = this.WAITING_NEW_LINE;
      }
    } else if (this.current === this.WAITING_NEW_LINE) {
      if (charactor === '\r') {
        this.current = this.WAITING_NEW_LINE_END;
      }
    } else if (this.current === this.WAITING_NEW_LINE_END) {
      if (charactor === '\n') {
        this.current = this.WAITING_LENGTH;
      }
    }
  }
}

```
