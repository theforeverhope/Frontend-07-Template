const css = require("css");
const EOF = Symbol("EOF"); // End of File
let currentToken = null;
let currentAttribute = null;

let stack = [{type: "document", children: []}];
let currentTextNode = null;

let rules = [];
function addCSSRules(text) {
  var ast = css.parse(text);
  // console.log(JSON.stringify(ast, null, "   "));
  rules.push(...ast.stylesheet.rules);
}

function specificity(selector) {
  let p = [0, 0, 0, 0];
  let selectorParts = selector.split(" ");
  for (let part of selectorParts) {
    if (part.charAt(0) == "#") {
      p[1] += 1;
    } else if (part.charAt(0) == ".") {
      p[2] += 1;
    } else {
      p[3] += 1;
    }
  }
  return p;
}

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
      // console.log(element.computedStyle)
    }
  }
}

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

    computeCSS(element);

    top.children.push(element);
    element.parent = top;

    if (!token.isSelfClosing) {
      stack.push(element);
    }

    currentTextNode = null;
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
  if (charactor == "/") { // case: </
    return endTagOpen;
  } else if (charactor.match(/^[a-zA-Z]$/)) { // case: <tagName
    currentToken = {
      type: "startTag",
      tagName: ""
    };
    return tagName(charactor);
  } else {
    return ; // error
  }
}

function endTagOpen(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) { // case: </tagName
    currentToken = {
      type: "endTag",
      tagName: ""
    };
    return tagName(charactor);
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

  } else if (charactor.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += charactor; //.toLowerCase
    return tagName;
  } else if (charactor == ">") { // case: <tagName>
    emit(currentToken);
    return data; // tag closed, a HTML tag parsing finished
  } else {
    return tagName;
  }
}

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

function selfClosingStartTag(charactor) {
  if (charactor == ">") { // case: <tagName/>
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data; // tag closed, a HTML tag parsing finished
  } else if (charactor == EOR) {
    // error
  } else {
    // error
  }
}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (let charactor of html) {
    state = state(charactor);
  }
  state = state(EOF);
  // console.log(stack[0]);
}