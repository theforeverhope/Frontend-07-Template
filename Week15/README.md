学习笔记

## 建立动画和时间线

- 建立时间线的方法
```javascript
// 方法1，缺点是浏览器对于setInterval的实现不同，时间不能保证，而且可能形成Interval积压。
setInterval(() => {}, 16)

// 方法2
let tick1 = () => {
  setTimeout(tick, 16)
}

// 方法3，推荐用法
let tick2 = () => {
  requestAnimationFrame(tick2)
}
```

- 建立时间线的实现
```javascript
// carousel.js
import { Component } from './framework.js';

export class Carousel extends Component {
  // ...
}
```

```javascript
// animation.js
const TICK = Symbol('tick');
const TICK_HANDLER = Symbol('tick-handler');
const ANIMATIONS = Symbol('animations');

export class Timeline {
  constructor() {
    this[ANIMATIONS] = new Set();
  }

  start() {
    let startTime = Date.now();
    this[TICK] = () => {
      let t = Date.now() - startTime
      for (let animation of this[ANIMATIONS]) {
        let t0 = t;
        if (animation.duration < t) {
          this[ANIMATIONS].delete(animation);
          t0 = animation.duration;  // make sure animation.receive(animation.duration) at last
        }
        animation.receive(t0);
      }
      requestAnimationFrame(this[TICK]);
    }
    this[TICK]();
  }

  // set rate() {}
  // get rate() {}

  pause() {}

  resume() {}

  reset() {}

  add(animation) {
    this[ANIMATIONS].add(animation);
  }
}

export class Animation {
  constructor(object, property, startValue, endValue, duration, timeFunction) {
    this.object = object;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.timeFunction = timeFunction;
  }

  receive(time) {
    let range = this.endValue - this.startValue;
    this.object[this.property] = this.startValue + range * time / this.duration;
  }
}
```

```javascript
// main.js
import { Component, createElement } from './framework.js';
import { Carousel } from './carousel.js';
import { Timeline, Animation } from './animation.js';

let pics = [
  "https://static001.geekbang.org/resource/image/bb/21/bb38fb7c1073eaee1755f81131f11d21.jpg",
  "https://static001.geekbang.org/resource/image/1b/21/1b809d9a2bdf3ecc481322d7c9223c21.jpg",
  "https://static001.geekbang.org/resource/image/b6/4f/b6d65b2f12646a9fd6b8cb2b020d754f.jpg",
  "https://static001.geekbang.org/resource/image/73/e4/730ea9c393def7975deceb48b3eb6fe4.jpg"
]

let a = <Carousel src={pics}/>
a.mountTo(document.body);

let tl = new Timeline();
tl.add(new Animation({}, "a", 0, 100, 1000, null))
tl.start();
```


## 设计时间线的更新

- 存在问题：缺少动画的delay实现，有可能在时间线执行之后的一段时间才添加动画。
- 实现动态向 Timeline 添加 Animation

```javascript
// animation.js
// const ...

export class Timeline {
  constructor() {
    this[ANIMATIONS] = new Set();
    this[ADD_TIME] = new Map();
  }

  start() {
    let startTime = Date.now();
    this[TICK] = () => {
      let now = Date.now();
      for (let animation of this[ANIMATIONS]) {
        let t;

        if (this[START_TIME].get(animation) < startTime)
          t = now - startTime;
        else 
          t = now - this[START_TIME].get(animation)

        if (animation.duration < now) {
          this[ANIMATIONS].delete(animation);
          t = animation.duration;
        }
        animation.receive(t);
      }
      requestAnimationFrame(this[TICK]);
    }
    this[TICK]();
  }

  pause() {}

  resume() {}

  reset() {}

  add(animation, startTime) {
    if (arguments.length < 2) {
      startTime = Date.now();
    }
    this[ANIMATIONS].add(animation);
    this[START_TIME].set(animation, startTime);
  }
}

export class Animation {
  constructor(object, property, startValue, endValue, duration, delay, timeFunction) {
    this.object = object;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.timeFunction = timeFunction;
    this.delay = delay;
  }

  receive(time) { 
    //... 
  }
}
```

```javascript
// main.js

let tl = new Timeline();
window.tl = tl;
window.animation = new Animation({ set a(v) {console.log(v)} }, "a", 0, 100, 1000, 0, null)
tl.start();

// tl.add(animation);  // 在控制台手动执行，测试动态添加 Animation
```


## 给动画添加暂停和重启功能

- 新建一个页面Demo

```html
<!-- animation.html -->
<body>
  <div id="el" style="width: 100px; height: 100px; background-color: lightblue;"></div>
  <button id="pause-btn">pause</button>
  <button id="resume-btn">resume</button>
  <script type="module" src="./animation-demo.js"></script>
</body>

```

- 简化入口文件

```javascript
// animation-demo.js
// 更换 webpack.config.js entry: "./animation-demo.js"
import { Timeline, Animation } from './animation.js';

let tl = new Timeline();
tl.start();

tl.add(new Animation(document.querySelector("#el").style, "transform", 0, 500, 2000, 0, null, v => `translateX(${v}px)`));

document.querySelector("#pause-btn").addEventListener("click", () => tl.pause());
document.querySelector("#resume-btn").addEventListener("click", () => tl.resume());
```

- 添加暂停和重启功能

```javascript
// animation.js
// const ...
const PAUSE_TIME = Symbol('pause-time');

export class Timeline {
  constructor() {
    // ...
  }

  start() {
    let startTime = Date.now();
    this[PAUSE_TIME] = 0; // initiate pause time
    this[TICK] = () => {
      let now = Date.now();
      for (let animation of this[ANIMATIONS]) {
        let t;

        if (this[START_TIME].get(animation) < startTime)
          t = now - startTime - this[PAUSE_TIME];  // subtract pause time
        else 
          t = now - this[START_TIME].get(animation) - this[PAUSE_TIME]; // subtract pause time

        if (animation.duration < t) {
          this[ANIMATIONS].delete(animation);
          t = animation.duration;
        }
        animation.receive(t);
      }
      this[TICK_HANDLER] = requestAnimationFrame(this[TICK]);
    }
    this[TICK]();
  }

  pause() {
    this[PAUSE_START] = Date.now();
    cancelAnimationFrame(this[TICK_HANDLER]);
  }

  resume() {
    this[PAUSE_TIME] += Date.now() - this[PAUSE_START]; // calculate pause time
    this[TICK]();
  }

  reset() {}

  add(animation, startTime) {
    // ...
  }
}

export class Animation {
  constructor(object, property, startValue, endValue, duration, delay, timeFunction, template) {
    this.object = object;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.timeFunction = timeFunction;
    this.delay = delay;
    this.template = template;
  }

  receive(time) {
    let range = this.endValue - this.startValue;
    this.object[this.property] = this.template(this.startValue + range * time / this.duration);
  }
}
```


## 完善动画功能

- 添加时间变化函数
```javascript
// ease.js
export function cubicBezier(p1x, p1y, p2x, p2y) {
  const ZERO_LIMIT = 1e-6;

  // Calculate the polynomial coefficients,
  // implicit first and last control points are (0,0) and (1,1).
  const ax = 3 * p1x - 3 * p2x + 1;
  const bx = 3 * p2x - 6 * p1x;
  const cx = 3 * p1x;

  const ay = 3 * p1y - 3 * p2y + 1;
  const by = 3 * p2y - 6 * p1y;
  const cy = 3 * p1y;

  function sampleCurveDerivativeX(t) {
    // ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return (3 * ax * t  + 2 * bx) * t + cx;
  }

  function sampleCurveX(t) {
    // ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((ax * t  + bx) * t + cx) * t;
  }

  function sampleCurveY(t) {
    // ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((ay * t  + by) * t + cy) * t;
  }

  // Given an x value, find a parametric value it came from.
  function solveCurveX(x) {
    var t2 = x;
    var derivative;
    var x2;

    // https://trac.webkit.org/browser/trunk/Source/WebCore/platform/animation
    // First try a few iterations of Newton's method -- normally very fast.
    // http://en.wikipedia.org/wiki/Newton's_method
    for (let i = 0; i < 8; i++) {
      // f(t)-x=0
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < ZERO_LIMIT) {
        return t2;
      }

      derivative = sampleCurveDerivativeX(t2);
      // == 0, failure
      /* istanbul ignore if */
      if (Math.abs(derivative) < ZERO_LIMIT) {
        break;
      }

      t2 -= x2 / derivative;
    }

    // Fail back to the bisection method for reliability.
    // bisection
    // http://en.wikipedia.org/wiki/Bisection_method
    var t1 = 1;
    /* istanbul ignore next */
    var t0 = 0;

    /* istanbul ignore next */
    t2 = x;
    /* istanbul ignore next */ 
    while (t1 > t0) {
      x2 = sampleCurveX(t2) - x;
      if (Math.abs(x2) < ZERO_LIMIT) {
        return t2;
      }

      if (x2 > 0) {
        t1 = t2;
      } else {
        t0 = t2;
      }
      t2 = (t1 + t0) / 2;
    }

    // Failure
    return t2;
  }

  function solve(x) {
    return sampleCurveY(solveCurveX(x));
  }

  return solve;
}

export const ease = cubicBezier(.25, .1, .25, 1);
export const easeIn = cubicBezier(.42, 0, 1, 1);
export const easeOut = cubicBezier(0, 0, .58, 1);
export const easeInOut = cubicBezier(.42, 0, .58, 1);

export const linear = cubicBezier(0, 0, 1, 1);
```

```javascript
// animation-demo.js
import { ease } from './ease.js';

//...
tl.add(new Animation(document.querySelector("#el").style, "transform", 0, 500, 2000, 0, ease, v => `translateX(${v}px)`));
//...
```

- 重置 Timeline

```javascript
// animation.js
// const ...

export class Timeline {
  constructor() {
    // ...
  }

  start() {
    let startTime = Date.now();
    this[PAUSE_TIME] = 0;
    this[TICK] = () => {
      let now = Date.now();
      for (let animation of this[ANIMATIONS]) {
        let t;

        if (this[START_TIME].get(animation) < startTime)
          t = now - startTime - this[PAUSE_TIME] - animation.delay;
        else 
          t = now - this[START_TIME].get(animation) - this[PAUSE_TIME] - animation.delay;

        if (animation.duration < t) {
          this[ANIMATIONS].delete(animation);
          t = animation.duration;
        }

        if (t > 0) 
          animation.receive(t);
      }
      this[TICK_HANDLER] = requestAnimationFrame(this[TICK]);
    }
    this[TICK]();
  }

  pause() {
    // ...
  }

  resume() {
    // ...
  }

  reset() {
    this.pause();
    this[PAUSE_TIME] = 0;
    this[ANIMATIONS] = new Set();
    this[START_TIME] = new Map();
    this[PAUSE_START] = 0;
    this[TICK_HANDLER] = null;
  }

  add(animation, startTime) {
    // ...
  }
}

export class Animation {
  constructor(object, property, startValue, endValue, duration, delay, timeFunction, template) {
    timeFunction = timeFunction || (v=>v);
    template = template || (v=>v);
    
    this.object = object;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.timeFunction = timeFunction;
    this.delay = delay;
    this.template = template;
  }

  receive(time) {
    let range = this.endValue - this.startValue;
    let progress = this.timeFunction(time / this.duration);
    this.object[this.property] = this.template(this.startValue + range * progress);
  }
}
```

## 对时间线进行状态管理

```javascript

export class Timeline {
  constructor() {
    this.state = "inited";
    // ...
  }

  start() {
    if (this.state !== "inited")
      return;
    this.state = "started";
    // ...
  }

  pause() {
    if (this.state !== "started")
      return;
    this.state = "paused";
    // ...
  }

  resume() {
    if (this.state !== "paused")
      return;
    this.state = "started";
    // ...
  }

  reset() {
    this.pause();
    this.state = "inited";
    // ...
  }

  add(animation, startTime) {
    // ...
  }
}
```


## 手势的基础知识

- start
  - end: tap
  - move 10px: pan start
  - continue 0.5s: press start

- pan start
  - move: pen move

- press start
  - move 10px: pan start
  - end: press end

- pen move
  - move: pen move
  - end and speed is over xxx: flick
  - end: pen end


## 实现手势操作的捕获
如果有浏览器事件发生，那么有可能打断touch事件，触发touchcancel。这是PC和Mobile事件的不同之处。

```javascript
let element = document.documentElement;
// ... listeners ...
let handler;
let startX, startY;
let isPen = false, isTap = true, isPress = false;

let start = (point) => {
  startX = point.clientX, startY = point.clientY;

  isPen = false;
  isTap = true;
  isPress = false;

  handler = setTimeout(() => {
    isPen = false;
    isTap = false;
    isPress = true;
    handler = null;
    console.log("press")
  }, 500);
}

let move = (point) => {
  let dx = point.clientX - startX;
  let dy = point.clientY - startY;

  if (!isPen && (dx ** 2 + dy ** 2 > 100)) {
    isPen = true;
    isTap = false;
    isPress = false;
    console.log("penstart");
    clearTimeout(handler);
  }

  if (isPen) {
    console.log("pen", dx, dy);
  }
}

let end = (point) => {
  if (isTap) {
    console.log("tap");
    clearTimeout(handler);
  }

  if (isPen) {
    console.log("penend");
  }

  if (isPress) {
    console.log("pressend");
  }
}

let cancel = (point) => {
  clearTimeout(handler);
  console.log("cancel", point.clientX, point.clientY);
}
```


## 处理鼠标事件

- 如果有多个手指或多个鼠标按键被按下，那么这些不同的点击事件不能共用同一个context。
- 对于鼠标点击事件，可以用event.button获取到点击值，值为0～5。
- 对于鼠标移动事件，鼠标不点击的情况下也会触发，其值存储在event.buttons里，表示有哪几个按键被按下，用二进制掩码表示0b00000，哪一个按键被按下对应位置就为1，否则为0。
- 当两个鼠标按键同时被点击，会注册两个相同的事件，并同时触发，需要用标识符 isListeningMouse 在第一次注册时做好标识，以免重复注册。

```javascript
let element = document.documentElement;

let isListeningMouse = false;
// PC 
element.addEventListener("mousedown", event => {
  let context = Object.create(null);
  contexts.set("mouse" + (1 << event.button), context);
  start(event, context);

  let mousemove = event => {
    let button = 1;
    while (button <= event.buttons) {
      if (button & event.buttons) { // press button
        // order of buttons & button is not the same
        let key = button;
        if (button === 2)
          key = 4;
        else if (button === 4) 
          key = 2;
        let context = contexts.get("mouse" + key);
        move(event, context);
      }
      button = button << 1;
    }
  }

  let mouseup = event => {
    let context = contexts.set("mouse" + (1 << event.button));
    end(event, context);
    contexts.delete("mouse" + (1 << event.button));

    if (event.buttons === 0) {
      element.removeEventListener("mousemove", mousemove);
      element.removeEventListener("mouseup", mouseup);
      isListeningMouse = false;
    }
  }

  // if two mouse button be clicked, then will register two of the same event 
  // so use isListeningMouse flag to prevent register duplicately
  if (!isListeningMouse) {
    element.addEventListener("mousemove", mousemove);
    element.addEventListener("mouseup", mouseup);
    isListeningMouse = true;
  }
});

let contexts = new Map();

// Mobile
element.addEventListener("touchstart", event => {
  for (let touch of event.changedTouches) {
    let context = Object.create(null);
    contexts.set(touch.identifier, context);
    start(touch, context);
  }
}); 

element.addEventListener("touchmove", event => {
  for (let touch of event.changedTouches) {
    let context = contexts.get(touch.identifier);
    move(touch, context);
  }
}); 

element.addEventListener("touchend", event => {
  for (let touch of event.changedTouches) {
    let context = contexts.get(touch.identifier);
    end(touch, context);
    contexts.delete(touch.identifier);
  }
}); 

element.addEventListener("touchcancel", event => {
  for (let touch of event.changedTouches) {
    let context = contexts.get(touch.identifier);
    cancel(touch, context);
    contexts.delete(touch.identifier);
  }
}); 

let start = (point, context) => {
  context.startX = point.clientX, context.startY = point.clientY;

  context.isPen = false;
  context.isTap = true;
  context.isPress = false;

  context.handler = setTimeout(() => {
    context.isPen = false;
    context.isTap = false;
    context.isPress = true;
    context.handler = null;
  }, 500);
}

let move = (point, context) => {
  let dx = point.clientX - context.startX;
  let dy = point.clientY - context.startY;

  if (!context.isPen && (dx ** 2 + dy ** 2 > 100)) {
    context.isPen = true;
    context.isTap = false;
    context.isPress = false;
    clearTimeout(context.handler);
  }

  if (context.isPen) {}
}

let end = (point, context) => {
  if (context.isTap) {
    clearTimeout(handler);
  }

  if (context.isPen) {}

  if (context.isPress) {}
}

let cancel = (point, context) => {
  clearTimeout(context.handler);
}
```


## 派发事件

```javascript
// gesture/index.js

// ...
function dispatch(type, properties) {
  let event = new Event(type);
  for (let name in properties) {
    event[name] = properties[name];
  }
  element.dispatchEvent(event);
}
```


## 实现一个 flick 事件

```javascript
// gesture/index.js

// ...

let start = (point, context) => {
  // ...
  context.points = [{
    t: Date.now(),
    x: point.clientX,
    y: point.clientY
  }]

  // ...
}

let move = (point, context) => {
  // ...

  // only keep points in half a second
  context.points = context.points.filter(point => Date.now() - point.t < 500)
  context.points.push({
    t: Date.now(),
    x: point.clientX,
    y: point.clientY
  })
}

let end = (point, context) => {
  // ...

  // only keep points in half a second
  context.points = context.points.filter(point => Date.now() - point.t < 500)

  let d, v;
  if (!context.points.length) {
    v = 0;
  } else {
    d = Math.sqrt((point.clientX - context.points[0].x) ** 2 + (point.clientY - context.points[0].y) ** 2);
    v = d / (Date.now() - context.points[0].t);
  }

  if (v > 1.5) {
    context.isFlick = true;
    dispatch("flick", {});
  } else {
    context.isFlick = false;
  }
  
}
```


## 封装

- Listener
```javascript
// gesture/index.js
export class Listener {
  constructor(element, recognizer) {
    let isListeningMouse = false;
    let contexts = new Map();

    // PC 
    element.addEventListener("mousedown", event => {
      let context = Object.create(null);
      contexts.set("mouse" + (1 << event.button), context);
      recognizer.start(event, context);
    
      let mousemove = event => {
        let button = 1;
        while (button <= event.buttons) {
          if (button & event.buttons) { // press button
            // order of buttons & button is not the same
            let key = button;
            if (button === 2)
              key = 4;
            else if (button === 4) 
              key = 2;
            let context = contexts.get("mouse" + key);
            recognizer.move(event, context);
          }
          button = button << 1;
        }
      }
    
      let mouseup = event => {
        let context = contexts.get("mouse" + (1 << event.button));
        recognizer.end(event, context);
        contexts.delete("mouse" + (1 << event.button));
    
        if (event.buttons === 0) {
          document.removeEventListener("mousemove", mousemove);
          document.removeEventListener("mouseup", mouseup);
          isListeningMouse = false;
        }
      }
    
      // if two mouse button be clicked, then will register two of the same event 
      // so use isListeningMouse flag to prevent register duplicately
      if (!isListeningMouse) {
        document.addEventListener("mousemove", mousemove);
        document.addEventListener("mouseup", mouseup);
        isListeningMouse = true;
      }
    });

    // Mobile
    element.addEventListener("touchstart", event => {
      for (let touch of event.changedTouches) {
        let context = Object.create(null);
        contexts.set(touch.identifier, context);
        recognizer.start(touch, context);
      }
    }); 

    element.addEventListener("touchmove", event => {
      for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier);
        recognizer.move(touch, context);
      }
    }); 

    element.addEventListener("touchend", event => {
      for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier);
        recognizer.end(touch, context);
        contexts.delete(touch.identifier);
      }
    }); 

    element.addEventListener("touchcancel", event => {
      for (let touch of event.changedTouches) {
        let context = contexts.get(touch.identifier);
        recognizer.cancel(touch, context);
        contexts.delete(touch.identifier);
      }
    }); 
    
  }
} 
```

- Recognizer
```javascript
// gesture/index.js
export class Recognizer {
  constructor(dispatcher) {
    this.dispatcher = dispatcher;
  }

  start(point, context) {
    context.startX = point.clientX, context.startY = point.clientY;
    context.points = [{
      t: Date.now(),
      x: point.clientX,
      y: point.clientY
    }]
  
    context.isPen = false;
    context.isTap = true;
    context.isPress = false;
  
    context.handler = setTimeout(() => {
      context.isPen = false;
      context.isTap = false;
      context.isPress = true;
      context.handler = null;
      this.dispatcher.dispatch("press", {});
    }, 500);
  }
  
  move(point, context) {
    let dx = point.clientX - context.startX;
    let dy = point.clientY - context.startY;
  
    if (!context.isPen && (dx ** 2 + dy ** 2 > 100)) {
      context.isPen = true;
      context.isTap = false;
      context.isPress = false;
      context.isVertical = Math.abs(dx) < Math.abs(dy);
      this.dispatcher.dispatch("penstart", {
        startX: context.startX,
        startY: context.startY,
        clientX: point.clientX,
        clientY: point.clientY,
        isVertical: context.isVertical
      });
      clearTimeout(context.handler);
    }
  
    if (context.isPen) {
      this.dispatcher.dispatch("pen", {
        startX: context.startX,
        startY: context.startY,
        clientX: point.clientX,
        clientY: point.clientY,
        isVertical: context.isVertical
      });
    }
  
    // only keep points in half a second
    context.points = context.points.filter(point => Date.now() - point.t < 500)
    context.points.push({
      t: Date.now(),
      x: point.clientX,
      y: point.clientY
    })
  }
  
  end(point, context) {
    if (context.isTap) {
      this.dispatcher.dispatch("tap", {});
      clearTimeout(context.handler);
    }
  
    if (context.isPress) {
      this.dispatcher.dispatch("pressend", {});
    }
  
    // only keep points in half a second
    context.points = context.points.filter(point => Date.now() - point.t < 500)
  
    let d, v;
    if (!context.points.length) {
      v = 0;
    } else {
      d = Math.sqrt((point.clientX - context.points[0].x) ** 2 + (point.clientY - context.points[0].y) ** 2);
      v = d / (Date.now() - context.points[0].t);
    }
  
    console.log('speed', v)
  
    if (v > 1.5) {
      context.isFlick = true;
      this.dispatcher.dispatch("flick", {
        startX: context.startX,
        startY: context.startY,
        clientX: point.clientX,
        clientY: point.clientY,
        isVertical: context.isVertical,
        isFlick: context.isFlick,
        velocity: v
      });
    } else {
      context.isFlick = false;
    }
    
    if (context.isPen) {
      this.dispatcher.dispatch("penend", {
        startX: context.startX,
        startY: context.startY,
        clientX: point.clientX,
        clientY: point.clientY,
        isVertical: context.isVertical,
        isFlick: context.isFlick
      });
    }
  }
  
  cancel(point, context) {
    this.dispatcher.dispatch("cancel", {});
    clearTimeout(context.handler);
  }
}
```

- Dispatcher
```javascript
// gesture/index.js
export class Dispatcher {
  constructor(element) {
    this.element = element;
  }

  dispatch(type, properties) {
    let event = new Event(type);
    for (let name in properties) {
      event[name] = properties[name];
    }
    this.element.dispatchEvent(event);
  }
}
```

- 集成
```javascript
// gesture/index.js
export function enableGesture(element) {
  new Listener(element, new Recognizer(new Dispatcher(element)));
}
```

```html
<!-- gesture/gesture.html -->
<body oncontextmenu="event.preventDefault()"></body>
<script type="module">  
  import { enableGesture } from './index.js'; 
  enableGesture(document.documentElement);
  document.documentElement.addEventListener("tap", e => console.log("tap event trigger!"))
</script>

```