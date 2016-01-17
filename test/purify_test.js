var expect = require('chai').expect;
var fs = require('fs');
var purify = require('../src/purifycss.js');
var absPath = __dirname + '/test_examples/';

var read = function (path) {
  return fs.readFileSync(absPath + path, 'utf8');
}

describe('purify', function(){
  it('can find classes intact', function(){
    var content = read('simple/simple.js');
    var css = read('simple/simple.css');
    var result = purify(content, css);

    expect(result.indexOf('.single') > -1).to.equal(true);
    expect(result.indexOf('.double-class') > -1).to.equal(true);
    expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
  });

  it('can use a callback', function(){
    var content = read('simple/simple.js');
    var css = read('simple/simple.css');

    purify(content, css, function(result){
      expect(result.indexOf('.single') > -1).to.equal(true);
      expect(result.indexOf('.double-class') > -1).to.equal(true);
      expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
    });
  });

  it('can find classes that are added together', function(){
    var content = read('combined/combined.js');
    var css = read('combined/combined.css');
    var result = purify(content, css);

    expect(result.indexOf('.added-together') > -1).to.equal(true);
    expect(result.indexOf('.array-joined') > -1).to.equal(true);
  });

  it('filters out classes not used', function(){
    var content = read('remove_unused/remove_unused.js');
    var css = read('remove_unused/remove_unused.css');
    var result = purify(content, css);

    expect(result.indexOf('.used-class') > -1).to.equal(true);
    expect(result.indexOf('.unused-class') === -1).to.equal(true);
    expect(result.indexOf('.another-one-not-found') === -1).to.equal(true);
  });

  it('works with multiple files', function(){
    var content = [absPath + 'multiple_files/multiple_files.js', absPath + 'multiple_files/multiple_files.html'];
    var css = [absPath + 'multiple_files/multiple_files.css', absPath + 'multiple_files/multiple_files2.css'];
    var result = purify(content, css);

    expect(result.indexOf('.taylor-swift') > -1).to.equal(true);
    expect(result.indexOf('.blank-space') > -1).to.equal(true);
    expect(result.indexOf('.shake-it-off') === -1).to.equal(true);
  });

  it('works with camelCase', function(){
    var content = read('camel_case/camel_case.js');
    var css = read('camel_case/camel_case.css');
    var result = purify(content, css);

    expect(result.indexOf('testFoo') > -1).to.equal(true);
    expect(result.indexOf('camelCase') > -1).to.equal(true);
  });

  it('works with wildcard, pseudo-elements', function(){
    var content = read('wildcard/wildcard.html');
    var css = read('wildcard/wildcard.css');
    var result = purify(content, css);

    expect(result.indexOf('*') > -1).to.equal(true);
    expect(result.indexOf('before') > -1).to.equal(true);
    expect(result.indexOf('scrollbar') > -1).to.equal(true);
    expect(result.indexOf('selection') > -1).to.equal(true);
    expect(result.indexOf('vertical') > -1).to.equal(true);
    expect(result.indexOf(':root') > -1).to.equal(true);
  });

  it('works with media queries', function(){
    var content = read('media_queries/media_queries.html');
    var css = read('media_queries/media_queries.css');
    var result = purify(content, css);

    expect(result.indexOf('.media-class') > -1).to.equal(true);
    expect(result.indexOf('.alone') > -1).to.equal(true);
    expect(result.indexOf('#id-in-media') > -1).to.equal(true);
    expect(result.indexOf('body') > -1).to.equal(true);
    expect(result.indexOf('.unused-class') > -1).to.equal(false);
    expect(result.indexOf('66666px') > -1).to.equal(false);
  });

  it('works with attribute selectors', function(){
    var content = read('attribute_selector/attribute_selector.js');
    var css = read('attribute_selector/attribute_selector.css');
    var result = purify(content, css);

    expect(result.indexOf('font-icon-') > -1).to.equal(true);
    expect(result.indexOf('center aligned') > -1).to.equal(true);
    expect(result.indexOf('github') > -1).to.equal(false);
  });

  it('works with special characters', function(){
    var content = read('special_characters/special_characters.js');
    var css = read('special_characters/special_characters.css');
    var result = purify(content, css);

    expect(result.indexOf('@home') > -1).to.equal(true);
    expect(result.indexOf('+rounded') > -1).to.equal(true);
    expect(result.indexOf('button') > -1).to.equal(true);
  });
});
