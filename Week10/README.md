学习笔记

## 排版 - 预处理

- flexDirection 和 wrap 相关属性
  - flex-direction: row 
    main: width x left right<br>
    cross: height y top<br>
  - flex-direction: column 
    main: height y top<br>
    cross: width x left right<br>

```javascript
// parser.js
function emit(token) {
  if (token.type === "startTag") {
    // ...
  } else if (token.type === "endTag") {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag's start and end does not match!");
    } else {
      // encounter style tag, add css rules
      // ...

      // layout dom element
      layout(top);
      // ...
    }
    // ...
  }
}
```

```javascript
// layout.js
function getStyle(element) {
  if (!element.style) {
    element.style = {};
  }

  for (let prop in element.computedStyle) {
    element.style[prop] = element.computedStyle[prop].value;

    if (element.style[prop].toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
    if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
      element.style[prop] = parseInt(element.style[prop]);
    }
  }

  return element.style;
}

function layout(element) {
  if (!element.computedStyle) {
    return;
  }

  let elementStyle = getStyle(element);

  // we only layout flex case
  if (elementStyle.display !== 'flex') {
    return;
  }

  let items = element.children.filter(item => item.type === 'element');
  items.sort(function(a, b) {
    return (a.order || 0) - (b.order || 0);
  });

  ['width', 'height'].forEach(size => {
    if (elementStyle[size] === 'auto' || elementStyle[size] === '') {
      elementStyle[size] = null;
    }
  })

  // set defualt value
  if (!elementStyle.flexDirection || elementStyle.flexDirection === 'layout')
    elementStyle.flexDirection = 'row';

  if (!elementStyle.alignItems || elementStyle.alignItems === 'auto') 
    elementStyle.alignItems = 'stretch';
  
  if (!elementStyle.justifyContent || elementStyle.justifyContent === 'auto') 
    elementStyle.justifyContent = 'flex-start';
  
  if (!elementStyle.flexWrap || elementStyle.flexWrap === 'auto') 
    elementStyle.flexWrap = 'nowrap';
  
  if (!elementStyle.alignContent || elementStyle.alignContent === 'auto') 
    elementStyle.alignContent = 'stretch';

  let mainSize, mainStart, mainEnd, mainSign, mainBase,
    crossSize, crossStart, crossEnd, crossSign, crossBase;
  
  if (elementStyle.flexDirection === 'row') {
    mainSize = 'width';
    mainStart = 'left';
    mainEnd = 'right';
    mainSign = +1;
    mainBase = 0;

    crossSize = 'height';
    crossStart = 'top';
    crossEnd = 'bottom';
  } else if (elementStyle.flexDirection === 'row-reverse') {
    mainSize = 'width';
    mainStart = 'right';
    mainEnd = 'left';
    mainSign = -1;
    mainBase = elementStyle.width;

    crossSize = 'height';
    crossStart = 'top';
    crossEnd = 'bottom';
  } else if (elementStyle.flexDirection === 'column') {
    mainSize = 'height';
    mainStart = 'top';
    mainEnd = 'bottom';
    mainSign = +1;
    mainBase = 0;

    crossSize = 'width';
    crossStart = 'left';
    crossEnd = 'right';
  } else if (elementStyle.flexDirection === 'column-reverse') {
    mainSize = 'height';
    mainStart = 'bottom';
    mainEnd = 'top';
    mainSign = -1;
    mainBase = elementStyle.height;

    crossSize = 'width';
    crossStart = 'left';
    crossEnd = 'right';
  }

  if (elementStyle.flexWrap === 'wrap-reverse') {
    let temp = crossStart;
    crossStart = crossEnd;
    crossEnd = temp;
  } else {
    crossBase = 0;
    crossSign = 1;
  }
}

module.exports = layout;
```


## 排版 - 收集元素入行

- 分行：根据主轴尺寸，把元素分入行。（若设置了'nowrap'，则强行分配进第一行。）
- 如果父元素没有设置主轴尺寸，则由其子元素撑开width。（isAutoMainSize = true）

```javascript
// layout.js

function layout(element) {
  // ...preprocess...

  // flex line collect items
  let isAutoMainSize = false;
  if (!elementStyle[mainSize]) {
    elementStyle[mainSize] = 0;
    for (let i = 0; i < items.length; i++) {
      elementStyle[mainSize] = elementStyle[mainSize] + items[i][mainSize];
    }

    isAutoMainSize == true;
  }

  let flexLine = [];
  let flexLines = [flexLine];
  // remain space
  let mainSpace = elementStyle[mainSize];
  let crossSpace = 0;

  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let itemStyle = getStyle(item);

    if (!item[mainSize]) {
      item[mainSize] = 0;
    }


    if (itemStyle.flex) {
      // this element is flexable, so it can be put into current line.
      flexLine.push(item);
    } else if (itemStyle.flexWrap === 'nowrap' && isAutoMainSize) {
      mainSpace -= itemStyle[mainSize];
      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
        // the height of line is the max height of items in line
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
      flexLine.push(item);
    } else {
      if (itemStyle[mainSize] > elementStyle[mainSize]) {
        // eg: when item width is large then line width, then set item width to line width.
        itemStyle[mainSize] = elementStyle[mainSize];
      }
      if (mainSpace < itemStyle[mainSize]) {
        // remaining space not enough for this item, then put it into a new line.
        flexLine.mainSpace = mainSpace;
        flexLine.crossSpace = crossSpace;
        flexLine = [item];
        flexLines.push(flexLine);
        mainSpace = elementStyle[mainSize];
        crossSpace = 0;
      } else {
        flexLine.push(item);
      }

      if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== (void 0)) {
        // the height of line is the max height of items in line
        crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
      }
      mainSpace -= itemStyle[mainSize];
    }
  }
}
```


## 布局 - 计算主轴

- 找出所有flex元素
- 把主轴剩余尺寸等比分给剩余元素
- 若剩余空间为负，所有flex元素为0，等比压缩剩余元素

```javascript
// layout.js

function layout(element) {
  // ...preprocess...

  // ... flex line collect items ...

  // compute main axis sise - mainSpace
    flexLine.mainSpace = mainSpace;

  if (elementStyle.flexWrap === 'nowrap' || isAutoMainSize) {
    flexLine.crossSpace = elementStyle[crossSize] !== undefined ? elementStyle[crossSize] : crossSpace;
  } else {
    flexLine.crossSpace = crossSpace;
  }

  if (mainSpace < 0) {
    let scale = itemStyle[mainSize] / itemStyle[mainSize] - mainSpace;
    let currentMain = mainBase;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let itemStyle = getStyle(item);

      if (itemStyle.flex)
        itemStyle[mainSize] = 0;
      
      itemStyle[mainSize] = itemStyle[mainSize] * scale;
      itemStyle[mainStart] = currentMain;
      itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
      currentMain = itemStyle[mainEnd];
    }
  } else {
    flexLines.forEach(items => {
      let mainSpace = items.mainSpace;
      let flexTotal = 0;
      // count flexTotal
      for(let i = 0; i < items.length; i++) {
        let item = items[i];
        let itemStyle = getStyle(item);

        if (itemStyle.flex !== null && itemStyle.flex !== (void 0))
          flexTotal += itemStyle.flex;
      }

      if (flexTotal > 0) {
        // has flex item, the flex item will expend to fill remaining space.
        let currentMain = mainBase;
        for(let i = 0; i < items.length; i++) {
          let item = items[i];
          let itemStyle = getStyle(item);

          if (itemStyle.flex)
            itemStyle[mainSize] = mainSpace / flexTotal * itemStyle.flex;
          
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd];
        }
      } else {
        // has not flex item, the justify-content should work.
        // step = gap length between two item
        let step = 0;
        let currentMain = 0;
        if (elementStyle.flexDirection === 'flex-start') {
          step = 0;
          currentMain = mainBase;
        } else if (elementStyle.flexDirection === 'flex-end') {
          step = 0;
          currentMain = mainBase + mainSpace * mainSign;
        } else if (elementStyle.flexDirection === 'center') {
          step = 0;
          currentMain = mainBase + mainSpace  / 2 * mainSign;
        } else if (elementStyle.flexDirection === 'space-between') {
          step = mainSpace / (items.length - 1) * mainSign;
          currentMain = mainBase;
        } else if (elementStyle.flexDirection === 'space-around') { // ???
          step = mainSpace / items.length * mainSign;
          currentMain = step / 2 + mainBase;
        }

        for(let i = 0; i < items.length; i++) {
          let item = items[i];
          let itemStyle = getStyle(item);
          itemStyle[mainStart] = currentMain;
          itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
          currentMain = itemStyle[mainEnd] + step;
        }
      }
    });
  }
}
```


## 布局 - 计算交叉轴

- 根据每一行中最大元素尺寸计算行高。
- 根据行高flex-align和item-align，确定元素位置。
- 修改server，返回flex布局的待解析页面代码。

```javascript
// layout.js

function layout(element) {
  // ...preprocess...

  // ... flex line collect items ...

  // ... compute main axis sise - mainSpace ...

  // compute cross axis size - crossSpace
  crossSpace = 0;

  if (!elementStyle[crossSize]) {
    elementStyle[crossSize] = 0;
    for (let i = 0; i < flexLines.length; i++) {
      elementStyle[crossSize] += flexLines[i].crossSpace;
    }
  } else {
    crossSpace = elementStyle[crossSize];
    for (let i = 0; i < flexLines.length; i++) {
      crossSpace -= flexLines[i].crossSpace;
    }
  }

  if (elementStyle.flexWrap === 'wrap-reverse') {
    crossBase = elementStyle[crossSize];
  } else {
    crossBase = 0;
  }

  let lineSize = elementStyle[crossSize] / flexLines.length;
  let step = 0;
  if (elementStyle.alignContent === 'flex-start') {
    step = 0;
    crossBase += 0;
  } else if (elementStyle.alignContent === 'flex-end') {
    step = 0;
    crossBase += crossSign * crossSpace;
  } else if (elementStyle.alignContent === 'center') {
    step = 0;
    crossBase += crossSign * crossSpace  / 2 ;
  } else if (elementStyle.alignContent === 'space-between') {
    step = crossSpace / (flexLines.length - 1);
    crossBase += 0;
  } else if (elementStyle.alignContent === 'space-around') { // ???
    step = crossSpace / flexLines.length;
    crossBase = crossSign * step / 2;
  } else if (elementStyle.alignContent === 'stretch') { // ???
    step = 0;
    crossBase += 0;
  }

  flexLines.forEach(items => {
    let lineCrossSize = elementStyle.alignContent === 'stretch' 
      ? items.crossSpace + crossSpace / flexLines.length  
      : items.crossSpace;

    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let itemStyle = getStyle(item);

      let align = itemStyle.alignSelf || elementStyle.alignItems;

      if (itemStyle[crossSize] === null) {
        itemStyle[crossSize] = (align === 'stretch') ? lineCrossSize : 0;
      }

      if (align === 'flex-start') {
        itemStyle[crossStart] = crossBase;
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      } else if (align === 'flex-end') {
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
        itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
      } else if (align === 'center') {
        itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2; 
        itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
      } else if (align === 'stretch') {
        itemStyle[crossStart] = crossBase; 
        itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
        itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
      }
    }

    crossBase += crossSign * (lineCrossSize + step);
  })
}
```

```javascript
// server.js
http.createServer((request, response) => {
  let body = [];
  request.on('error', err => {
    // ...
  }).on('data', chunk => {
   // ...
  }).on('end', () => {
    // ...
    response.end(`<html maaa=a >
    <head>
      <style>
      #container {
        width:500px;
        height:300px;
        display:flex;
      }
      #container #myid {
        width:200px;
      }
      #container .c1 {
        flex: 1;
      }
      </style>
    </head>
    <body>
      <div id="container">
        <div id="myid" />
        <div class="c1" />
      </div>
    </body>
    </html>`);
  });
}).listen(8088, () => {
  // ...
});
```


## 渲染 - 绘制单个元素

- 准备图形环境：用生成图片代替绘制到屏幕（使用库images)
- server 给 div 上色，便于查看绘制效果

```javascript
// server.js
http.createServer((request, response) => {
  let body = [];
  request.on('error', err => {
    // ...
  }).on('data', chunk => {
   // ...
  }).on('end', () => {
    // ...
    response.end(`<html maaa=a >
    <head>
      <style>
      #container {
        width:500px;
        height:300px;
        display:flex;
        background-color: rgb(255,255,255);
      }
      #container #myid {
        width:200px;
        height:100px;
        background-color: rgb(255,0,0);
      }
      #container .c1 {
        flex: 1;
        background-color: rgb(0,255,0);
      }
      </style>
    </head>
    <body>
      <div id="container">
        <div id="myid" />
        <div class="c1" />
      </div>
    </body>
    </html>`);
  });
}).listen(8088, () => {
  // ...
});
```

```javascript
// client.js
const images = require("images");

// ... class: Request ResponseParser ThunkedBodyParser 

function render(viewport, element) {
  if (element.style) {
    var img = images(element.style.width, element.style.height);

    if (element.style["background-color"]) {
      let color = element.style["background-color"] || "rgb(0,0,0)";
      color.match(/rgb\((\d+),(\d+),(\d+)\)/);
      img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3));
      viewport.draw(img, element.style.left || 0, element.style.top || 0);
    }
  }
}

void async function () {
  // ... 

  let viewport = images(800, 600);
  render(viewport, dom.children[0].children[3].children[1].children[3])
  viewport.save("viewport.jpg")
}();

```


## 渲染 - 绘制Dom树

- 递归调用子元素的绘制方法完成Dom树绘制
- 忽略不需要绘制的节点
- 实际浏览器中，文字绘制是难点，需要依赖字体库（把字体变成图片去渲染），这里先忽略。
- 实际浏览器中，还会对一些图层做compositing，这里也忽略了。

```javascript
// client.js
const images = require("images");

// ... class: Request ResponseParser ThunkedBodyParser 

function render(viewport, element) {
  // ... if (element.style) { ... }

  if (element.children) {
    for(let child of element.children) {
      render(viewport, child);
    }
  }
}

void async function () {
  // ... 

  let viewport = images(800, 600);
  render(viewport, dom)
  viewport.save("viewport_all.jpg")
}();
```
