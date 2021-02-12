学习笔记

## 学习CSS的线索

- 以语法为线索开始学习：[https://www.w3.org/TR/CSS21/grammar.html]
- rule & at-rule


## At-rule

- @charset[https://www.w3.org/TR/css-syntax-3]
- @import[https://www.w3.org/TR/css-cascade-4]
- @media[https://www.w3.org/TR/css-conditional]
- @page[https://www.w3.org/TR/css-page-3]
- @counter-style[https://www.w3.org/TR/css-counter-style-3]
- @keyframes[https://www.w3.org/TR/css-animations-1]
- @fontface[https://www.w3.org/TR/css-fonts-3]
- @supports[https://www.w3.org/TR/css-conditional]
- @namespace[https://www.w3.org/TR/css-namespaces-3]


## Rule: CSS规则

- Selector[https://www.w3.org/TR/selector-3] [https://www.w3.org/TR/selector-4]
- Key
  - Properties
  - Variables[https://www.w3.org/TR/css-variables]
- Value[https://www.w3.org/TR/css-values-4]


## 收集标准

- 数据源[https://www.w3.org/TR/?tag=css]

```javascript
// css standard crawler

let standards = Array.prototype.slice.call(document.querySelector("#container").children).filter(e =>
  e.getAttribute("data-tag").match(/css/)).map(e => ({
    name: e.children[1].innerText, 
    url: e.children[1].children[0].href
  }));

console.log(JSON.stringify(standards));

let iframe = document.createElement("iframe");
document.body.innerHTML = "";
document.body.appendChild(iframe);

function happen(element, event) {
  return new Promise((resolve) => {
    let handler = () => {
      resolve();
      element.removeEventListener(event, handler);
    }
    element.addEventListener(event, handler);
  })
}

void async function () {
  for (let standard of standards) {
    iframe.src = standard.url;
    console.log(standard.name);
    await happen(iframe, "load")
    console.log(iframe.contentDocument.querySelectorAll(".propdef"))
  }
}
```


## 选择器语法

- 简单选择器
  - *
  - div svg|a (|是css的namespace分隔符)
  - .class
  - #id
  - [ attr=value ]
  - :hover
  - ::before

- 复合选择器
  - <简单选择器><简单选择器><简单选择器>
  - *或者div必须写在最前面

- 复杂选择器
  - <复合选择器>< sp ><复合选择器> (子孙选择器)
  - <复合选择器>">"<复合选择器> (父子选择器)
  - <复合选择器>"～"<复合选择器> (邻接选择器)
  - <复合选择器>"+"<复合选择器> (邻接选择器)
  - <复合选择器>"||"<复合选择器> (表格列选择器)

- 伪类
  - 链接行为（:any-link | :link :visited | :hover | :active | :focus | :target）
  - 树结构（:empty | :nth-child() | :nth-last-child() | :first-child :last-child :only-child）
  - 逻辑性（:not伪类 | :where :has）


## 思考：为什么 first-letter 可以设置 float 之类的，而 first-line 不行呢?

- ::first-line CSS pseudo-element （CSS伪元素）在某 block-level element （块级元素）的第一行应用样式。第一行的长度取决于很多因素，包括元素宽度，文档宽度和文本的文字大小。所以如果可以float，那么需要计算第一行到哪个字符开始浮动，而这一情况会根据字体等文字样式改变，导致浏览器渲染的计算困难，影响性能。