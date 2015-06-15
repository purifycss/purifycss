var expect = require('chai').expect;
var fs = require('fs');
var purify = require('../src/purifycss.js');
var absPath = __dirname + '/test_examples/';

describe('purify', function(){
  it('can find classes intact', function(){
    var content = fs.readFileSync(absPath + 'simple/simple.js', 'utf8');
    var css = fs.readFileSync(absPath + 'simple/simple.css', 'utf8');
    var result = purify(content, css);

    expect(result.indexOf('.single') > -1).to.equal(true);
    expect(result.indexOf('.double-class') > -1).to.equal(true);
    expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
  });

  it('can use a callback', function(){
    var content = fs.readFileSync(absPath + 'simple/simple.js', 'utf8');
    var css = fs.readFileSync(absPath + 'simple/simple.css', 'utf8');

    purify(content, css, function(result){
      expect(result.indexOf('.single') > -1).to.equal(true);
      expect(result.indexOf('.double-class') > -1).to.equal(true);
      expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
    });
  });

  it('can find classes that are added together', function(){
    var content = fs.readFileSync(absPath + 'combined/combined.js', 'utf8');
    var css = fs.readFileSync(absPath + 'combined/combined.css', 'utf8');
    var result = purify(content, css);

    expect(result.indexOf('.added-together') > -1).to.equal(true);
    expect(result.indexOf('.array-joined') > -1).to.equal(true);
  });

  it('filters out classes not used', function(){
    var content = fs.readFileSync(absPath + 'remove_unused/remove_unused.js', 'utf8');
    var css = fs.readFileSync(absPath + 'remove_unused/remove_unused.css', 'utf8');
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
    var content = fs.readFileSync(absPath + 'camel_case/camel_case.js', 'utf8');
    var css = fs.readFileSync(absPath + 'camel_case/camel_case.css', 'utf8');
    var result = purify(content, css);

    expect(result.indexOf('testFoo') > -1).to.equal(true);
    expect(result.indexOf('camelCase') > -1).to.equal(true);
  });

  it('works with wildcard, pseudo-elements', function(){
    var content = fs.readFileSync(absPath + 'wildcard/wildcard.html', 'utf8');
    var css = fs.readFileSync(absPath + 'wildcard/wildcard.css', 'utf8');
    var result = purify(content, css);

    expect(result.indexOf('*') > -1).to.equal(true);
    expect(result.indexOf('before') > -1).to.equal(true);
    expect(result.indexOf('scrollbar') > -1).to.equal(true);
    expect(result.indexOf('selection') > -1).to.equal(true);
    expect(result.indexOf('vertical') > -1).to.equal(true);
  });

  it('works with media queries', function(){
    var content = fs.readFileSync(absPath + 'media_queries/media_queries.js', 'utf8');
    var css = fs.readFileSync(absPath + 'media_queries/media_queries.css', 'utf8');
    var result = purify(content, css);

    expect(result.indexOf('.media-class') > -1).to.equal(true);
    expect(result.indexOf('.alone') > -1).to.equal(true);
    expect(result.indexOf('#id-in-media') > -1).to.equal(true);
    expect(result.indexOf('body') > -1).to.equal(true);
    expect(result.indexOf('.unused-class') > -1).to.equal(false);
  });
});