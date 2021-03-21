学习笔记

## 手势动画应用

- 以 main 为 webpack入口, 引入并初始化轮播图

```javascript
// webpack.config.js
module.exports = {
  entry: "./main.js",
  // ...
}
```

```javascript
// main.js
import { Component, createElement } from './framework.js';
import { Carousel } from './Carousel.js';

let pics = [
  "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
  "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
  "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg"
]

let a = <Carousel src={pics}/>
a.mountTo(document.body);
```

- 在轮播图里初始化时间线动画（Timeline）使轮播图自动轮播
  - 通过让 currentIndex = position，将时间线动画和手势动画链接起来。

```javascript
// Carousel.js
// import ...
import { Timeline, Animation } from './animation/index.js';
import { ease } from './animation/ease.js';

export class Carousel extends Component {
  // ...
  render() {
    // ...
    enableGesture(this.root);
    let timeline = new Timeline();
    timeline.start();

    // currentIndex === position
    let nextPicture = () => {
      let children = this.root.children;
      let nextIndex = (position + 1) % children.length;
      let current = children[position];
      let next = children[nextIndex];
      t = Date.now();

      timeline.add(new Animation(current.style, "transform",
        - position * 500, -500 - position * 500, 1500, 0, ease, v => `translateX(${v}px)`));
      timeline.add(new Animation(next.style, "transform",
        500 - nextIndex * 500, - nextIndex * 500, 1500, 0, ease, v => `translateX(${v}px)`))

      position = nextIndex;
    }
    handler = setInterval(nextPicture, 3000)

    // ...
  }
  // ...
}
```

- 在轮播图里初始化手势动画（Gesture）使轮播图响应交互事件
  - 在 start 事件里，让 timeline 暂停
  - 在 pen 事件里，让当前图片和其前后的三张图片一起跟随鼠标滑动
  - 在 end 事件里，重置 timeline 并启动，并根据 direction 确定当前图片和其前后的三张图片的最后位置并完成滑动动画。如果此时交互的事件速度达到 flick 标准，那么根据速度的方向来决定 direction 的方向，完成滑动动画。

```javascript
// Carousel.js
// import ...
import { enableGesture } from './gesture/index.js';

export class Carousel extends Component {
  // ...
  render() {
    // ...

    let children = this.root.children;
    let t = 0;
    let ax = 0; // drag offset

    this.root.addEventListener("start", event => {
      timeline.pause();
      clearInterval(handler);
      let progress = (Date.now() - t) / 1500;
      ax = ease(progress) * 500 - 500;
    })

    this.root.addEventListener("pen", event => {
      let distX = event.clientX - event.startX - ax;
      let current = position - ((distX - distX % 500) / 500);
      for (let offset of [-1, 0, 1]) {
        let pos = current + offset;
        pos = (pos % children.length + children.length) % children.length;
        children[pos].style.transition = "none";
        children[pos].style.transform = `translateX(${(- pos + offset) * 500 + distX % 500}px)`;
      }
    })

    this.root.addEventListener("end", event => {
      timeline.reset();
      timeline.start();
      handler = setInterval(nextPicture, 3000)

      let distX = event.clientX - event.startX - ax;
      let current = position - ((distX - distX % 500) / 500);
      let direction = Math.round((distX % 500) / 500);

      if (event.isFlick) {
        if (event.velocity < 0) {
          direction = Math.ceil((distX % 500) / 500);
        } else {
          direction = Math.floor((distX % 500) / 500);
        }
      }

      for (let offset of [-1, 0, 1]) {
        let pos = current + offset;
        pos = (pos % children.length + children.length) % children.length;
        children[pos].style.transition = "none";
        timeline.add(new Animation(children[pos].style, "transform",
          (- pos + offset) * 500 + distX % 500,
          (- pos + offset) * 500 + direction * 500,
          1500, 0, ease, v => `translateX(${v}px)`));
      }

      position = position - ((distX - distX % 500) / 500) - direction;
      // if drag too far then position will be a large negtive number, make it to be positive one.
      position = (position % children.length + children.length) % children.length;
    })

    // ...
  }
  // ...
}
```


## 为组件添加事件

- 组件父类添加私有状态，存储计算过程中状态值。
- 将子组件 setAttribute 和 mountTo 方法转移到父类，使子类可以只需简单实现 render 方法。

```javascript
// framework.js
export const STATE = Symbol("state");
export const ATTRIBUTE = Symbol("attribute");

export class Component {
  constructor() {
    this[STATE] = Object.create(null);
    this[ATTRIBUTE] = Object.create(null);
  }
  setAttribute(name, value) {
    this[ATTRIBUTE][name] = value;
  }
  appendChild(child) {
    child.mountTo(this.root);
  }
  mountTo(parent) {
    if (!this.root) {
      this.render()
    }
    parent.appendChild(this.root);
  }
}
```

```javascript
// Carousel.js
export { STATE, ATTRIBUTE } from './framework.js';

export class Carousel extends Component {
  constructor() {
    super();
  }

  render() {
    // ...
    for (let record of this[ATTRIBUTE].src) {
      // ...
    }

    // 将 position 存入 this[STATE] 后使用
    this[STATE].position = 0;
    // 所有 position -> this[STATE].position

    // ...
  }
}
```

- 添加 change 事件返回图片位置

```javascript
// main.js 测试代码
// ...
let a = <Carousel src={pics} onChange={e => console.log(e.detail.position)}/>
// ...
```

```javascript
// framework.js
export class Component {
  // ...
  triggerEvent(type, args) {
    // replace 将 type 第一个字母转成大写，实现事件 type 定义规则的匹配
    this[ATTRIBUTE]["on" + type.replace(/^[\s\S]/, s => s.toUpperCase())](new CustomEvent(type, { detail: args }))
  }
}
```

```javascript
// Carousel.js
export class Carousel extends Component {
  // ...

  render() {
    // ...

    this.root.addEventListener("end", event => {
      // ... 
      // 在修改 this[STATE].position 的位置都触发 change
      this.triggerEvent("Change", { position: this[STATE].position });
    })

    let nextPicture = () => {
      // ... 
      // 在修改 this[STATE].position 的位置都触发 change
      this.triggerEvent("Change", { position: this[STATE].position });
    }
    handler = setInterval(nextPicture, 3000)

    // ...
  }
}
```

- 添加 click 事件返回图片的所有信息，并添加跳转

```javascript
// main.js 测试代码
// ...
let pics = [
  {
    img: "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
    url: "https://www.google.com/"
  },
  {
    img: "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
    url: "https://cn.bing.com/"
  },
  {
    img: "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
    url: "https://search.yahoo.com"
  },
  {
    img:  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg",
    url: "https://www.baidu.com/"
  },
]

let a = <Carousel src={pics} 
  onChange={e => console.log(e.detail.position)}
  onClick={e => window.location.href = e.detail.data.url}/>
// ...
```

```javascript
// Carousel.js
export class Carousel extends Component {
  // ...

  render() {
    // ...

    for (let record of this[ATTRIBUTE].src) {
      // ...
      child.style.backgroundImage = `url('${record.img}')`;
      // ...
    }

    // ...

    this.root.addEventListener("tap", event => {
      this.triggerEvent("click", { 
        data: this[ATTRIBUTE].src[this[STATE].position],
        position: this[STATE].position 
      });
    })

    // ...
  }
}
```


## 实现内容型 children 机制

```javascript
// main.js
import { Button } from './Button.js';

let b = <Button>Button content</Button>;
b.mountTo(document.body);
```

```javascript
// Button.js
import { Component, createElement, STATE, ATTRIBUTE } from './framework.js';
import { enableGesture } from './gesture/index.js';

// import into this file and then export
export { STATE, ATTRIBUTE } from './framework.js';

export class Button extends Component {
  constructor() {
    super();
  }

  render() {
    this.childContainer = <span />;
    this.root = (<div>{this.childContainer}</div>).render();
    return this.root;
  }

  appendChild(child) {
    if (!this.childContainer)
      this.render();
    this.childContainer.appendChild(child);
  }
}
```


```javascript
// framework.js
// ...
class ElementWrapper extends Component {
  constructor(type) {
    // 继承
    super();
    this.root = document.createElement(type);
  }
}


class TextWrapper extends Component {
  constructor(content) {
    // 继承
    super();
    this.root = document.createTextNode(content);
  }
}
```


## 实现模版型 children 机制

```javascript
// main.js
import { List } from './List.js';

let pics = [
  {
    img: "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
    url: "https://www.google.com/",
    title: "google"
  },
  {
    img: "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
    url: "https://cn.bing.com/",
    title: "bing"
  },
  {
    img: "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
    url: "https://search.yahoo.com",
    title: "yahoo"
  },
  {
    img:  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg",
    url: "https://www.baidu.com/",
    title: "baidu"
  },
]

let l = <List data={pics}>
  {
    (record) => <div>
      <img src={record.img} />
      <a herf={record.url}>{record.title}</a>
    </div>
  }
</List>;
```

```javascript
// List.js
import { Component, createElement, STATE, ATTRIBUTE } from './framework.js';
import { enableGesture } from './gesture/index.js';

// import into this file and then export
export { STATE, ATTRIBUTE } from './framework.js';

export class List extends Component {
  constructor() {
    super();
  }

  render() {
    this.children = this[ATTRIBUTE].data.map(this.template);
    this.root = (<div>{this.children}</div>).render();
    return this.root;
  }

  appendChild(child) {
    this.template = child;
  }
}
```

```javascript
// framework.js
export function createElement(type, attributes, ...children) {
  // ...

  // 递归渲染 children
  let procssChildren = (children) => {
    for (let child of children) {
      if ((typeof child === "object") && (child instanceof Array)) {
        procssChildren(child);
        continue;
      }

      if (typeof child === "string") {
        child = new TextWrapper(child);
      }
      element.appendChild(child);
    }
  }
  procssChildren(children);
  
  // ...
}

class ElementWrapper extends Component {
  // ...
  // 重载 setAttribute 方法，设置图片
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
}
```