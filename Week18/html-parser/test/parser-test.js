var assert = require('assert');

import {parseHTML} from '../src/parser.js'; // use new grammar with Babel

describe('parse html:', function() { // grouping
  it('<a></a>', function() {
    let tree = parseHTML('<a></a>');
    assert.equal(tree.children[0].tagName, "a");
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<a href="//time.geekbang.org">abc</a>', function() {
    let tree = parseHTML('<a href="//time.geekbang.org">abc</a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 1);
  });

  it('<a href= "//time.geekbang.org" >abc</a>', function() {
    let tree = parseHTML('<a href= "//time.geekbang.org" >abc</a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 1);
  });

  it('<a href ></a>', function() {
    let tree = parseHTML('<a href ></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<a href></a>', function() {
    let tree = parseHTML('<a href></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<a href id></a>', function() {
    let tree = parseHTML('<a href id></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });
  
  it('<a href="abc" id></a>', function() {
    let tree = parseHTML('<a href="abc" id></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<a href="abc" id></a>', function() {
    let tree = parseHTML('<a href="abc" id></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  // 352 beforeAttributeName
  it('<a href=abc id></a>', function() {
    let tree = parseHTML('<a href=abc id></a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  // 332-333 selfClosingStartTag
  it('<a href=abc/>', function() {
    let tree = parseHTML('<a href=abc/>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  // 314-323 singleQuotedAttributeValue
  it('<a href=\'abc\'/>', function() {
    let tree = parseHTML('<a href=\'abc\'/>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  // 232 beforeAttributeName - afterAttributeName
  it('<a />', function() {
    let tree = parseHTML('<a />');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<a/>', function() {
    let tree = parseHTML('<a/>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  it('<A /> upper case', function() {
    let tree = parseHTML('<A />');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 0);
  });

  // 183 tagOpen
  it('<>', function() {
    let tree = parseHTML('<>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].type, "text");
  });

  // 149 encounter style tag
  it('<style>div{color:red;}</style>', function() {
    let tree = parseHTML('<style>div{color:red;}</style>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 1);
  });

  // 74-105 css priority
  it('<style>div{color:red;}</style><div style="color:blue"></div>', function() {
    let tree = parseHTML('<style>div{color:red;}</style><div style="color:blue"></div>');
    assert.equal(tree.children.length, 2);
    assert.equal(tree.children[0].children.length, 1);
  });

  it('<style>#d{color:black;}</style><div id="d" style="color:blue"></div>', function() {
    let tree = parseHTML('<style>#d{color:black;}</style><div id="d" style="color:blue"></div>');
    assert.equal(tree.children.length, 2);
    assert.equal(tree.children[0].children.length, 1);
  });

  it('<style>div{color:red;} #d{color:black;}</style><div id="d" style="color:blue"></div>', function() {
    let tree = parseHTML('<style>div{color:red;} #d{color:black;}</style><div id="d" style="color:blue"></div>');
    assert.equal(tree.children.length, 2);
    assert.equal(tree.children[0].children.length, 1);
  });

  // 103-105 css priority
  it('<style>.divName{color:red;} div{color: green;}</style><div class="divName"></div>', function() {
    let tree = parseHTML('<style>.divName{color:red;} div{color: green;}</style><div class="divName"></div>');
    assert.equal(tree.children.length, 2);
    assert.equal(tree.children[0].children.length, 1);
  });

  it('<a> </a>', function() {
    let tree = parseHTML('<a> </a>');
    assert.equal(tree.children.length, 1);
    assert.equal(tree.children[0].children.length, 1);
  });

  // // 146 tagName not equal
  // it('<a></div>', function() {
  //   let tree = parseHTML('<a></div>');
  //   console.log(tree)
  //   assert.equal(tree.children.length, 2);
  //   assert.equal(tree.children[0].children.length, 1);
  // });
});