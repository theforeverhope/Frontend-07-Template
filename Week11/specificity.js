let node = {
  type: "descendantsSelector",
  name: ""
};

let nodes = {
  inlineSelector: [],
  idSelector: [],
  classSelector: [],
  tagNameSelector: []
}

function parser(string) {
  let state = start;
  nodes = {
    inlineSelector: [],
    idSelector: [],
    classSelector: [],
    tagNameSelector: []
  }
  for (charactor of string) {
    state = state(charactor);
  }
  initNode("descendantsSelector");
  return [
    nodes.inlineSelector.length, 
    nodes.idSelector.length,
    nodes.classSelector.length,
    nodes.tagNameSelector.length
  ]
}

function initNode(type) {
  if (node.type !== type 
      && node.type !== "descendantsSelector" 
      && node.type !== "attributeSelector" 
      && node.type !== "unknownSelector" 
      && node.type !== "" ) {
    nodes[node.type].push(node);
    node = {
      type: type,
      name: ""
    }
  } else if (node.type === "descendantsSelector" || node.type === "unknownSelector") {
    node = {
      type: type,
      name: ""
    }
  }
}

function start(charactor) {
  if (charactor === "#") {
    initNode("idSelector");
    return idSelector;
  } else if (charactor === ".") {
    initNode("classSelector");
    return classSelector;
  } else if (charactor.match(/^[\t\n\f ]$/)) {
    initNode("descendantsSelector");
    return start;
  } else if (charactor === "[") {
    initNode("attributeSelector");
    return attributeSelector;
  } else if (charactor === "*") {
    initNode("descendantsSelector");
    return start;
  } else {
    if (node.type === "descendantsSelector" && charactor.match(/^[a-z]$/)) {
      node.type = "tagNameSelector";
      return tagNameSelector(charactor);
    } else {
      initNode("unknownSelector");
      return start;
    }
  }
}

function idSelector(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) {
    node.name += charactor;
    return idSelector;
  } else {
    return start(charactor);
  }
}

function classSelector(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) {
    node.name += charactor;
    return classSelector;
  } else {
    return start(charactor);
  }
}

function attributeSelector(charactor) {
  if (charactor === "]") {
    node.type = "classSelector";
    initNode("descendantsSelector");
    return start;
  } else {
    node.name += charactor;
    return attributeSelector;
  }
}

function tagNameSelector(charactor) {
  if (charactor.match(/^[a-zA-Z]$/)) {
    node.name += charactor;
    return tagNameSelector;
  } else {
    return start(charactor);
  }
}


["div#a.b .c[id=x]", "#a:not(#b)", "*.a", "div.a"].map(str => console.log(parser(str)));
