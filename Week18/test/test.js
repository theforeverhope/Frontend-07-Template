var assert = require('assert');

import {add} from './add.js'; // use new grammar with Babel

describe('add function testing', function() { // grouping
  it('1+2 should be 3', function() {
    assert.equal(add(1,2), 3);
  });

  it('-5+2 should be -3', function() {
    assert.equal(add(-5,2), -3);
  });
});