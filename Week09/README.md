学习笔记

## HTML解析：接口设计

- 设计思路：用单独的 parser 来解析 HTML，也就是从 server 传来的 respose.body。
- 接口设计：parser 接收 HTML 作为参数，返回一个 Dom 树。

```javascript
// client.js
const parser = require('./parser.js');
// ... class Request ...
void async function () {
  let request = new Request({
      //...
    }
  });

  let response = await request.send();
  let dom = parser.parseHTML(response.body);
}();
```

```javascript
// parser.js
module.exports.parseHTML = function parseHTML(html) {
  console.log(html)
}
```


## HTML解析：Parser实现设计

- 设计思路：利用 FSM 来实现 HTML 分析
- 设计依据：根据 HTML 标准中的定义来实现[https://html.spec.whatwg.org/multipage/parsing.html#tokenization]，但仅挑选其中常用的部分状态。
- 用 Symbol 设置特殊结束符，标志HTML内容分析到了结束位置。

```javascript
// parser.js
const EOF = Symbol("EOF"); // End of File

function data() {}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (let charactor of html) {
    state = state(charactor);
  }
  state = state(EOF);
}
```


## HTML解析：解析标签

- 标签分类：开始标签、结束标签、自封闭标签。
- 暂时忽略属性，只解析 HTML 标签。

- data
  - case <: tagOpen
  - case EOF: end
  - other case: data (continue parsing)

- tagOpen
  - case /: endTagOpen
  - case /a-zA-Z/: tagName
  - other case: error

- endTagOpen
  - case /a-zA-Z/: tagName
  - case >: error
  - case EOF: error

- tagName
  - case \t\n\fSPACE: beforeAttributeName
  - case /: selfClosingStartTag
  - case >: data (tag closed)
  - other case: tagName

- beforeAttributeName
  - case \t\n\fSPACE: beforeAttributeName
  - case >: data (tag closed)
  - case =: beforeAttributeName
  - other case: beforeAttributeName

- selfClosingStartTag
  - case >: data (isSelfClosing = true)
  - case EOF: error
  - other case: error

```javascript
// parser.js

function data(charactor) {
  if (charactor == "<") {
    return tagOpen;
  } else if (charactor == EOF) {
    return ;
  } else {
    return data;
  }
}

function tagOpen(charactor) {
  if (charactor == "/") { // case: </
    return endTagOpen;
  } else if (charactor.match(/^[a-zA-Z]$/)) { // case: <tagName
    return tagName;
  } else {
    return ; // error
  }
}

function endTagOpen(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) { // case: </tagName
    return tagName;
  } else if (charactor == ">") {
    // error
  } else if (charactor == EOF) {
    // error
  } else {
    // error
  }
}

function tagName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) { // case: <tagName attributeName
    return beforeAttributeName;
  } else if (charactor == "/") { // case: <tagName/
    return selfClosingStartTag;
  } else if (charactor == ">") { // case: <tagName>
    return data; // tag closed, a HTML tag parsing finished
  } else {
    return tagName;
  }
}

function beforeAttributeName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) { // case: <tagName attributeName=... attributeName
    return beforeAttributeName;
  } else if (charactor == ">") { // tag closed, a HTML tag parsing finished
    return data; // tag closed, a HTML tag parsing finished
  } else if (charactor == "=") { 
    return beforeAttributeName; // wait to continue parsing
  } else {
    return beforeAttributeName; // wait to continue parsing
  }
}

function selfClosingStartTag(charactor) {
  if (charactor == ">") { // case: <tagName/>
    return data; // tag closed, a HTML tag parsing finished
  } else if (charactor == EOR) {
    // error
  } else {
    // error
  }
}
```


## HTML解析：创建元素

- 在状态机中，除了状态迁移，还要加入业务逻辑（创建token，字符加入token，emit token）。
- 在标签结束状态提交 emit token。

```javascript
// parser.js
let currentToken = null;

function emit(token) {
  console.log(token);
}

function data(charactor) {
  if (charactor == "<") {
    return tagOpen;
  } else if (charactor == EOF) {
    emit({
      type: "EOP"
    })
    return ;
  } else {
    emit({
      type: "text",
      content: charactor
    })
    return data;
  }
}

function tagOpen(charactor) {
  if (charactor == "/") { 
    return endTagOpen;
  } else if (charactor.match(/^[a-zA-Z]$/)) { 
    currentToken = { // collect startTag token
      type: "startTag",
      tagName: ""
    };
    return tagName(charactor);
  }
  // else ...
}

function endTagOpen(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) { 
    currentToken = { // collect endTag token
      type: "endTag",
      tagName: ""
    };
    return tagName(charactor);
  } 
  // else if ....
}

function tagName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) { 
    return beforeAttributeName;
  } 
  // else if ....
  else if (charactor.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += charactor; //.toLowerCase, collect tagName
    return tagName;
  } else if (charactor == ">") { 
    emit(currentToken); // tag closed, emit currentToken
    return data; 
  }
  // else ...
}

// ...beforeAttributeName...

function selfClosingStartTag(charactor) {
  if (charactor == ">") { 
    currentToken.isSelfClosing = true; // mark the token is selfClosing token
    return data;
  }
  // else if ....
}
```


## HTML解析：处理属性

- 属性分类：单引号、双引号、无引号 三种写法
- 类似标签，用一个对象暂存过程中数据，当属性结束时把属性加到标签 token 上

- beforeAttributeName
  - case \t\n\fSPACE: beforeAttributeName
  - case /: afterAttributeName
  - case >: afterAttributeName
  - case EOF: afterAttributeName
  - case =: error
  - other case: attributeName

- attributeName
  - case \t\n\fSPACE: afterAttributeName
  - case /: afterAttributeName
  - case >: afterAttributeName
  - case EOF: afterAttributeName
  - case =: beforeAttributeValue
  - case \u0000: error
  - case ": error
  - case ': error
  - case <: error
  - other case: attributeName

- beforeAttributeValue
  - case \t\n\fSPACE: beforeAttributeValue
  - case /: beforeAttributeValue
  - case >: beforeAttributeValue
  - case EOF: beforeAttributeValue
  - case ": doubleQuotedAttributeValue
  - case ': singleQuotedAttributeValue
  - other case: unquotedAttributedValue 

- afterAttributeName
  - case \t\n\fSPACE: afterAttributeName
  - case /: selfClosingStartTag
  - case =: beforeAttributeValue
  - case >: data (tag closed)
  - case EOF: error
  - other case: attributeName

- doubleQuotedAttributeValue
  - case ": afterQuotedAttributeValue
  - case \u0000: error
  - case EOF: error
  - doubleQuotedAttributeValue

- singleQuotedAttributeValue
  - case ': afterQuotedAttributeValue
  - case \u0000: error
  - case EOF: error
  - singleQuotedAttributeValue

- unquotedAttributedValue
  - case \t\n\fSPACE: beforeAttributeName
  - case \u0000: error
  - case EOF: error
  - unquotedAttributedValue

- afterQuotedAttributeValue
  - case \t\n\fSPACE: beforeAttributeName
  - case /: selfClosingStartTag
  - case =: beforeAttributeValue
  - case >: data (tag closed)
  - case EOF: error
  - other case: ...

```javascript
// parser.js
let currentAttribute = null;

function beforeAttributeName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) { // case: <tagName attributeName=... attributeName
    return beforeAttributeName;
  } else if (charactor == ">" || charactor == "/" || charactor == EOF) { 
    return afterAttributeName(charactor); // tag closed, a HTML tag parsing finished
  } else if (charactor == "=") { 
    // error
  } else { 
    // encounter valid charactor, initiate currentAttribute
    currentAttribute = {
      name: "",
      value: "",
    }
    return attributeName(charactor);
  }
}

function attributeName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/) || charactor == ">" || charactor == "/" || charactor == EOF ) {
    return afterAttributeName(charactor);
  } else if (charactor == "=") {
    return beforeAttributeValue;
  } else if (charactor == "\u0000") {
    // error
  } else if (charactor == "\"" || charactor == "'" || charactor == "<") {
    // error
  } else {
    currentAttribute.name += charactor;
    return attributeName;
  }
}

function afterAttributeName(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (charactor == "/") {
    return selfClosingStartTag;
  } else if (charactor == "=") {
    return beforeAttributeValue;
  } else if (charactor == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (charactor == EOF) {
    // error
  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: "",
      value: ""
    };
    return attributeName;
  }
}

function beforeAttributeValue(charactor) {
  if (charactor.match(/^[\t\n\f ]$/) || charactor == ">" || charactor == "/" || charactor == EOF ) {
    return beforeAttributeValue;
  } else if (charactor == "\"") {
    return doubleQuotedAttributeValue;
  } else if (charactor == "'") {
    return singleQuotedAttributeValue;
  } else if (charactor == ">") {
    // return data;
  } else {
    return unquotedAttributedValue(charactor);
  }
}

function doubleQuotedAttributeValue(charactor) {
  if (charactor == "\"") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (charactor == "\u0000") {
    // error
  } else if (charactor == EOF) {
    // error
  } else {
    currentAttribute.value += charactor;
    return doubleQuotedAttributeValue;
  }
}

function singleQuotedAttributeValue(charactor) {
  if (charactor == "'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQuotedAttributeValue;
  } else if (charactor == "\u0000") {
    // error
  } else if (charactor == EOF) {
    // error
  } else {
    currentAttribute.value += charactor;
    return singleQuotedAttributeValue;
  }
}

function unquotedAttributedValue(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforeAttributeName;
  } else if (charactor == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (charactor == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (charactor == "\"" || charactor == "'" || charactor == "<" || charactor == "=") {
    // error
  } else if (charactor == "\u0000") {
    // error
  } else if (charactor == EOF) {
    // error
  } else {
    currentAttribute.value += charactor;
    return unquotedAttributedValue;
  }
}

function afterQuotedAttributeValue(charactor) {
  if (charactor.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName;
  } else if (charactor == "/") {
    return selfClosingStartTag;
  } else if (charactor == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (charactor == EOF) {
    // error
  } else {
    currentAttribute.value += charactor;
    return afterQuotedAttributeValue;
  }
}
```


## HTML解析：构建Dom树

- 思路：使用栈，从标签 token 构建 Dom 树。
- 规则：
  - 遇到开始标签时创建元素并入栈，遇到结束标签时出栈。自封闭节点可以视为入栈后立即出栈。
  - 任何元素的父元素都是它入栈的前的栈顶元素。

```javascript
// parser.js
let stack = [{type: "document", children: []}];

function emit(token) {
  let top = stack[stack.length - 1];

  if (token.type === "startTag") {
    let element = {
      type: "element",
      children: [],
      attributes: []
    };

    element.tagName = token.tagName;

    for (let key in token) {
      if (key !== "type" && key !== "tagName") {
        element.attributes.push({
          name: key,
          value: token[key],
        });
      }
    }

    top.children.push(element);
    element.parent = top;

    if (!token.isSelfClosing) {
      stack.push(element);
    }
  } else if (token.type === "endTag") {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag's start and end does not match!");
    } else {
      stack.pop();
    }
  }
}
```

## HTML解析：将文本标签加入Dom树

- 文本节点与自封闭标签的处理类似
- 多个文本节点需要合并

```javascript
// parser.js
let currentTextNode = null;

function emit(token) {
  // ...

  if (token.type === "startTag") {
    // ...
    currentTextNode = null;
  } else if (token.type === "endTag") {
    // ...
    currentTextNode = null;
  } else if (token.type === "text") {
    if (currentTextNode == null) {
      currentTextNode = {
        type: "text",
        content: ""
      };
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
```


## CSS计算：收集CSS规则

- 遇到style标签，把CSS规则保存起来。
- 调用 CSS Parser 来分析CSS规则。
- 研究库分析CSS规则的格式。

```javascript
const css = require("css");

let rules = [];
function addCSSRules(text) {
  var ast = css.parse(text);
  rules.push(...ast.stylesheet.rules);
}

function emit(token) {
  // ...
  if (token.type === "startTag") {
    // ...
  } else if (token.type === "endTag") {
    if (top.tagName !== token.tagName) {
      throw new Error("Tag's start and end does not match!");
    } else {
      // encounter style tag, add css rules
      if (top.tagName === "style") {
        addCSSRules(top.children[0].content);
      }
      stack.pop();
    } 
    currentTextNode = null;
  }
  // ...
}
```


## CSS计算：添加CSS规则解析

- 在创建元素（element）后，立即计算CSS。
- 假设：理论上，当我们分析一个元素时，所有CSS规则依据已经收集完毕。
- 实际：在真实浏览器中，可能遇到写在body的style标签，需要重新计算CSS的情况，这里忽略。

```javascript
// parser.js

function computeCSS(element) {
  // put rules to element
}

function emit(token) {
  let top = stack[stack.length - 1];

  if (token.type === "startTag") {
    // ... 
    computeCSS(element);
    // ...
  }
  // ...
}
```


## CSS计算：获取父元素序列

- 在计算CSS（computeCSS）过程中，我们必须知道元素的所有父元素才能判断元素与规则是否匹配。
- 从上一步的stack中可以获取本元素的所有父元素。
- 因为计算CSS（computeCSS）过程中首先获取到的是当前元素，所以获取和计算元素匹配的父元素的顺序是从内向外的。（例：div div #myid，前两个div不知道匹配的是哪个元素，但是#myid一定是匹配当前元素。)

```javascript
// parser.js

function computeCSS(element) {
  // stack.slice() is equal to copy(stack)
  let elements = stack.slice().reverse();
}
```


## CSS计算：选择器与元素匹配

- 选择器也要从当前元素向外排列。
- 复杂选择器拆成针对单个元素的选择器，用循环匹配父元素队列。

```javascript
// parser.js

function match(element, selector) {
  return false;
}

function computeCSS(element) {
  // stack.slice() is equal to copy(stack)
  let elements = stack.slice().reverse();

  if (!element.computedStyle) {
    element.computedStyle = {}
  }

  for (let rule of rules) {
    let selectorParts = rule.selectors[0].split(" ").reverse();

    if (!match(element, selectorParts[0])) {
      continue;
    }

    let matched = false;
    let j = 1;
    for (var i = 0; i < elements.length; i++) {
      // body div #myid all matched
      if (match(elements[i], selectorParts[j])) {
        j++;
      }
    }

    if (j >= selectorParts.length) {
      matched = true;
    }

    if (matched) {
      console.log("Element ", element, " match rule: ", rule);
    }
  }
}
```


## CSS计算：计算选择器与元素匹配

- 根据选择器类型和元素属性，计算是否与当前元素匹配
- 这里仅仅实现了三种基本选择器，实际浏览器中要处理复合选择器

```javascript
// parser.js

function match(element, selector) {
  if (!selector || !element.attributes)
    return false;
  
  if (selector.charAt(0) == "#") {
    let attr = element.attributes.filter(attr => attr.name === "id")[0]
    if (attr && attr.value === selector.replace("#", ''))
      return true;
  } else if (selector.charAt(0) == ".") {
    let attr = element.attributes.filter(attr => attr.name === "class")[0]
    if (attr && attr.value === selector.replace(".", ''))
      return true;
  } else {
    if (element.tagName === selector) {
      return true;
    }
  }

  return false;
}
```


## CSS计算：生成computed属性

- 一旦选择匹配，就应用到元素上，形成computedStyle

```javascript
// parser.js

function computeCSS(element) {
  for (let rule of rules) {
    // ...

    if (matched) {
      let computedStyle = element.computedStyle;
      for (let declaration of rule.declarations) {
        if (!computedStyle[declaration.property])
          computedStyle[declaration.property] = {};
        computedStyle[declaration.property].value =  declaration.value;
      }
    }
  }
}
```


## CSS计算：specificity的计算

- CSS规则根据specificity和后来优先规则覆盖
- 优先级：inline > id > class > tagName 形成四元组，分别计算每一种选择器的数量，逐位比较两个CSS优先级的高低。（如 [ 0, 1, 0, 1] > [ 0, 1, 1, 2]）
- 一个CSS规则的specificity根据包含的简单选择器相加而成

```javascript
// parser.js

function compare(sp1, sp2) {
  if (sp1[0] - sp2[0])
    return sp1[0] - sp2[0];
  if (sp1[1] - sp2[1])
    return sp1[1] - sp2[1];
  if (sp1[2] - sp2[2])
    return sp1[2] - sp2[2];

  return sp1[3] - sp2[3];
}

function match(element, selector) {
  if (!selector || !element.attributes)
    return false;

  if (selector.charAt(0) == "#") {
    let attr = element.attributes.filter(attr => attr.name === "id")[0]
    if (attr && attr.value === selector.replace("#", ''))
      return true;
  } else if (selector.charAt(0) == ".") {
    let attr = element.attributes.filter(attr => attr.name === "class")[0]
    if (attr && attr.value === selector.replace(".", ''))
      return true;
  } else {
    if (element.tagName === selector) {
      return true;
    }
  }

  return false;
}

function computeCSS(element) {
  for (let rule of rules) {
    // ...

    if (matched) {
      let sp = specificity(rule.selectors[0]);
      let computedStyle = element.computedStyle;
      for (let declaration of rule.declarations) {
        if (!computedStyle[declaration.property]) {}
          computedStyle[declaration.property] = {};

        if (!computedStyle[declaration.property].specificity) {
          computedStyle[declaration.property].value =  declaration.value;
          computedStyle[declaration.property].specificity = sp;
        } else if (compare(computedStyle[declaration.property].specificity, sp)) {
          computedStyle[declaration.property].value =  declaration.value;
          computedStyle[declaration.property].specificity = sp;
        }
      }
    }
  }
}
```

