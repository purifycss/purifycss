var expect = require('chai').expect;
var fs = require('fs');
var purify = require('../src/purifycss.js');
var absPath = __dirname + '/test_examples/';

describe('purify', function(){
  it('can test', function(){
    var content = fs.readFileSync(absPath + 'simple/simple.js', 'utf8');
    var css = fs.readFileSync(absPath + 'simple/simple.css', 'utf8');
    var result = purify(content, css);
    expect(result.indexOf('.single') > -1).to.equal(true);
    expect(result.indexOf('.double-class') > -1).to.equal(true);
    expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
  });
});