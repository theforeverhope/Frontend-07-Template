学习笔记

## 组件组成

- 设计组件状态

| Markup set | JS set | JS Change | User Input Change |           |
| ---------- | ------ | --------- | ----------------- | --------- |
|      ❌     |   ⭕️   |    ⭕️     |        ❓         |  property |
|      ⭕️     |   ⭕️   |    ⭕️     |        ❓         | attribute |
|      ❌     |   ❌   |    ❌     |        ⭕️         |   state   |
|      ❌     |   ⭕️   |    ❌     |        ❌         |   config  |

- 组件生命周期

  - created
  - mount/unmount
  - render/update
  - destroyed


## 为组件添加JSX语法

- 创建文件夹
```zsh
$ mkdir jsx
$ cd jsx
$ npm init
```

- 安装 Webpack CLI
```zsh
$ npm install --save-dev webpack webpack-cli -g
```

- 本地目录安装 babel-loader
```zsh
$ npm install --save-dev webpack babel-loader
```

- 本地目录安装 babel 
```zsh
$ npm install --save-dev @babel/core @babel/preset-env
```

- 配置 webpack.config.js
```javascript
module.exports = {
  entry: "./main.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  mode: "development" // 发布时改成 "production"
}
```

- 配置 package.json
```JSON
{
  "scripts": {
    "start": "webpack --config webpack.config.js",
  },
}
```

- 安装 babel plugin
```zsh
$ npm install --save-dev @babel/plugin-transform-react-jsx
```

- 配置 webpack.config.js
```javascript
module.exports = {
  entry: "./main.js",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-transform-react-jsx"] // 添加 plugin
          }
        }
      }
    ]
  },
  mode: "development" // 发布时改成 "production"
}
```

## JSX的基本使用方法

- 替换 React.createElement
```javascript
// webpack.config.js
module.exports = {
  entry: "./main.js",
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
```

```javascript
// main.js
function createElement(type, attributes, ...children) {
  let element = document.createElement(type);
  for (let name in attributes) {
    element.setAttribute(name, attributes[name]);
  }

  for (let child of children) {
    if (typeof child === "string") {
      child = document.createTextNode(child);
    }
    element.appendChild(child);
  }
  return element;
}

let a = <div id="a">
  <span>Hello World</span>
  <span></span>
  <span></span>
</div>

document.body.appendChild(a);
```

```html
<!-- /dist/main.html -->
<body>
  <script src="./main.js"></script>
</body>
```

- 自定义 type - Div

```javascript
function createElement(type, attributes, ...children) {
  let element = null;
  if (typeof type === "string") {
    element = new ElementWrapper(type);
  } else {
    element = new type;
  }

  for (let name in attributes) {
    element.setAttribute(name, attributes[name]);
  }

  for (let child of children) {
    if (typeof child === "string") {
      child = new TextWrapper(child);
    }
    element.appendChild(child);
  }
  return element;
}

class ElementWrapper{
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(child) {
    child.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class Div{
  constructor() {
    this.root = document.createElement("div");
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(child) {
    child.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class TextWrapper{
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(child) {
    child.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

let a = <Div id="a">
  <span>a</span>
  <span>b</span>
  <span>c</span>
</Div>

a.mountTo(document.body);
```


## 轮播组件

- 抽象 framework
```javascript
// framework.js

export function createElement(type, attributes, ...children) {
  let element = null;
  if (typeof type === "string") {
    element = new ElementWrapper(type);
  } else {
    element = new type;
  }

  for (let name in attributes) {
    element.setAttribute(name, attributes[name]);
  }

  for (let child of children) {
    if (typeof child === "string") {
      child = new TextWrapper(child);
    }
    element.appendChild(child);
  }
  return element;
}

export class Component {
  constructor() {
    
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(child) {
    child.mountTo(this.root);
  }
  mountTo(parent) {
    parent.appendChild(this.root);
  }
}

class ElementWrapper extends Component {
  constructor(type) {
    this.root = document.createElement(type);
  }
}

class TextWrapper extends Component {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
}
```

- 构造轮播组件 Carousel
```javascript
// main.js
import {Component, createElement} from './framework.js'

class Carousel extends Component {
  constructor() {
    super();
    this.attributes = Object.create(null);
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  render() {
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for (let record of this.attributes.src) {
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      this.root.appendChild(child);
    }

    return this.root;
  }
  mountTo(parent) {
    parent.appendChild(this.render());
  }
}

let pics = [
  "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
  "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
  "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg"
]

let a = <Carousel src={pics}/>

a.mountTo(document.body);
```

- 轮播组件的样式
  - 由于 img 可以被拖动，所以利用 div + background-image 的方式实现每一张轮播图片
  - 轮播图片横行排列，在正常流里用 display:inline-block 实现
  - 每次只显示一张图片，用 overflow: hidden 实现
  - 轮播动画，用 transition: ease 0.5s 实现
```html
<!-- /dist/main.html -->
<head>
  <style>
    .carousel {
      width: 500px;
      height: 280px;
      overflow: hidden;
      white-space: nowrap;
    }
    .carousel>div {
      width: 500px;
      height: 280px;
      display: inline-block;
      background-size: contain;
      transition: ease 0.5s;
    }
  </style>
</head>
<body>
  <script src="./main.js"></script>
</body>
```

- 制造轮播效果
  - 利用 setInterval 实现定时翻动图片效果
  - 利用 current 记录当前页码，并计算 translate 数值
```javascript
// main.js

//...import...

class Carousel extends Component {
  //...
  render() {
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for (let record of this.attributes.src) {
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      this.root.appendChild(child);
    }

    let current = 0;
    setInterval(() => {
      ++current;
      let children = this.root.children;
      current = current % children.length;
      for(let child of children) {
        child.style.transform = `translate(-${100 * current}%)`;
      }
    }, 3000)

    return this.root;
  }
  //...
}

// ...
```

- 轮播图首尾链接效果
```javascript
// main.js

//...import...

class Carousel extends Component {
  //...
  render() {
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for (let record of this.attributes.src) {
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      this.root.appendChild(child);
    }

    let currentIndex = 0;
    setInterval(() => {
      let children = this.root.children;

      let nextIndex = (currentIndex + 1) % children.length;
      let current = children[currentIndex];
      let next = children[nextIndex];

      next.style.transition = "none";
      next.style.transform = `translateX(${100 - nextIndex * 100}%)`;

      setTimeout(() => {
        next.style.transition = "";
        current.style.transform = `translateX(${-100 - nextIndex * 100}%)`;
        next.style.transform = `translateX(${- nextIndex * 100}%)`;

        currentIndex = nextIndex;
      }, 16);
    }, 3000)

    return this.root;
  }
  //...
}

// ...
```

- 鼠标拖动交互
```javascript
// main.js

//...import...

class Carousel extends Component {
  //...
  render() {
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for (let record of this.attributes.src) {
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      this.root.appendChild(child);
    }

    let position = 0;

    this.root.addEventListener("mousedown", event => {
      let children = this.root.children;
      let startX = event.clientX;
      
      let move = event => {
        let distX = event.clientX - startX;
        for (let child of children) {
          child.style.transition = "none";
          child.style.transform = `translateX(${- position * 500 + distX}px)`;
        }
      }

      let up = event => {
        let distX = event.clientX - startX;
        position = position - Math.round(distX / 500);
        for (let child of children) {
          child.style.transition = "";
          child.style.transform = `translateX(${- position * 500}px)`;
        }
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    })

    // ...

    return this.root;
  }
  //...
}

// ...
```

- 处理轮播逻辑
```javascript
// main.js

//...import...

class Carousel extends Component {
  //...
  render() {
    this.root = document.createElement("div");
    this.root.classList.add("carousel");
    for (let record of this.attributes.src) {
      let child = document.createElement("div");
      child.style.backgroundImage = `url('${record}')`;
      this.root.appendChild(child);
    }

    let position = 0;

    this.root.addEventListener("mousedown", event => {
      let children = this.root.children;
      let startX = event.clientX;
      
     let move = event => {
        let distX = event.clientX - startX;
        let current = position - ((distX - distX % 500) / 500);
        for (let offset of [-1, 0, 1]) {
          let pos = current + offset;
          pos = (pos + children.length) % children.length;
          children[pos].style.transition = "none";
          children[pos].style.transform = `translateX(${(- pos + offset) * 500 + distX % 500}px)`;
        }
      }

      let up = event => {
        let distX = event.clientX - startX;
        position = position - Math.round(distX / 500);
        for (let offset of [0, - Math.sign(Math.round(distX / 500) - distX + 250 * Math.sign(distX))]) {
          let pos = position + offset;
          pos = (pos + children.length) % children.length;
          children[pos].style.transition = "";
          children[pos].style.transform = `translateX(${(- pos + offset) * 500}px)`;
        }
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
      }

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
    })

    // ...

    return this.root;
  }
  //...
}

// ...
```
