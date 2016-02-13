var expect = require('chai').expect;
var fs = require('fs');
var purify = require('../src/purifycss.js');
var absPath = __dirname + '/test_examples/';

var read = function (path) {
  return fs.readFileSync(absPath + path, 'utf8');
}

describe('purify', function () {
  describe('find intact classes', function () {
    beforeEach(function () {
      var content = read('simple/simple.js');
      var css = read('simple/simple.css');
      this.result = purify(content, css);
    });

    it('finds .single', function () {
      expect(this.result.indexOf('.single') > -1).to.equal(true);
    });

    it('finds .double-class', function () {
      expect(this.result.indexOf('.double-class') > -1).to.equal(true);
    });

    it('can find .triple-simple-class', function () {
      expect(this.result.indexOf('.triple-simple-class') > -1).to.equal(true);
    });
  });

  describe('callback', function () {
    beforeEach(function () {
      this.content = read('simple/simple.js');
      this.css = read('simple/simple.css');
    });

    it('can use a callback', function () {
      purify(this.content, this.css, function (result) {
        expect(result.indexOf('.triple-simple-class') > -1).to.equal(true);
      });
    });
  });

  describe('classes that are added together', function () {
    beforeEach(function () {
      var content = read('combined/combined.js');
      var css = read('combined/combined.css');
      this.result = purify(content, css);
    });

    it('can find .added-together', function () {
      expect(this.result.indexOf('.added-together') > -1).to.equal(true);
    });

    it('can find .array-joined', function () {
      expect(this.result.indexOf('.array-joined') > -1).to.equal(true);
    });
  });

  describe('filters out unused selectors', function () {
    beforeEach(function () {
      var content = read('remove_unused/remove_unused.js');
      var css = read('remove_unused/remove_unused.css');
      this.result = purify(content, css);
    });

    it('contains .used-class', function () {
      expect(this.result.indexOf('.used-class') > -1).to.equal(true);
    });

    it('removes .unused-class', function () {
      expect(this.result.indexOf('.unused-class') === -1).to.equal(true);
    });

    it('removes .another-one-not-found', function () {
      expect(this.result.indexOf('.another-one-not-found') === -1).to.equal(true);
    });
  });

  describe('works with multiple files', function () {
    beforeEach(function () {
      var content = ['**/test_examples/multiple_files/*.+(js|html)'];
      var css = ['**/test_examples/multiple_files/*.css'];
      this.result = purify(content, css);
    });

    it('finds .taylor-swift', function () {
      expect(this.result.indexOf('.taylor-swift') > -1).to.equal(true);
    });

    it('finds .blank-space', function () {
      expect(this.result.indexOf('.blank-space') > -1).to.equal(true);
    });

    it('removes .shake-it-off', function () {
      expect(this.result.indexOf('.shake-it-off') === -1).to.equal(true);
    });
  });

  describe('camelCase', function () {
    beforeEach(function () {
      var content = read('camel_case/camel_case.js');
      var css = read('camel_case/camel_case.css');
      this.result = purify(content, css);
    });

    it('finds testFoo', function () {
      expect(this.result.indexOf('testFoo') > -1).to.equal(true);
    });

    it('finds camelCase', function () {
      expect(this.result.indexOf('camelCase') > -1).to.equal(true);
    });
  });

  describe('wildcard', function () {
    beforeEach(function () {
      var content = read('wildcard/wildcard.html');
      var css = read('wildcard/wildcard.css');
      this.result = purify(content, css);
    });

    it('finds universal selector', function () {
      expect(this.result.indexOf('*') > -1).to.equal(true);
    });

    it('finds :before', function () {
      expect(this.result.indexOf('before') > -1).to.equal(true);
    });

    it('finds scrollbar', function () {
      expect(this.result.indexOf('scrollbar') > -1).to.equal(true);
    });

    it('finds selection', function () {
      expect(this.result.indexOf('selection') > -1).to.equal(true);
    });

    it('finds vertical', function () {
      expect(this.result.indexOf('vertical') > -1).to.equal(true);
    });

    it('finds :root', function () {
      expect(this.result.indexOf(':root') > -1).to.equal(true);
    });
  });

  describe('media queries', function () {
    beforeEach(function () {
      var content = read('media_queries/media_queries.html');
      var css = read('media_queries/media_queries.css');
      this.result = purify(content, css);
    });

    it('finds .media-class', function () {
      expect(this.result.indexOf('.media-class') > -1).to.equal(true);
    });

    it('finds .alone', function () {
      expect(this.result.indexOf('.alone') > -1).to.equal(true);
    });

    it('finds #id-in-media', function () {
      expect(this.result.indexOf('#id-in-media') > -1).to.equal(true);
    });

    it('finds body', function () {
      expect(this.result.indexOf('body') > -1).to.equal(true);
    });

    it('removes .unused-class', function () {
      expect(this.result.indexOf('.unused-class') > -1).to.equal(false);
    });

    it('removes the empty media query', function () {
      expect(this.result.indexOf('66666px') > -1).to.equal(false);
    });
  });

  describe('attribute selectors', function () {
    beforeEach(function () {
      var content = read('attribute_selector/attribute_selector.html');
      var css = read('attribute_selector/attribute_selector.css');
      this.result = purify(content, css);
    });

    it('finds font-icon-', function () {
      expect(this.result.indexOf('font-icon-') > -1).to.equal(true);
    });

    it('finds center aligned', function () {
      expect(this.result.indexOf('center aligned') > -1).to.equal(true);
    });

    it('does not find github', function () {
      expect(this.result.indexOf('github') > -1).to.equal(false);
    });
  });

  describe('special characters', function () {
    beforeEach(function () {
      var content = read('special_characters/special_characters.js');
      var css = read('special_characters/special_characters.css');
      this.result = purify(content, css);
    });

    it('finds @home', function () {
      expect(this.result.indexOf('@home') > -1).to.equal(true);
    });

    it('finds +rounded', function () {
      expect(this.result.indexOf('+rounded') > -1).to.equal(true);
    });

    it('finds button', function () {
      expect(this.result.indexOf('button') > -1).to.equal(true);
    });
  });

  describe('delimited', function () {
    beforeEach(function () {
      var content = read('delimited/delimited.html');
      var css = read('delimited/delimited.css');
      this.result = purify(content, css);
    });

    it('removes the extra comma', function () {
      var commaCount = this.result.split('').reduce(function (total, chr) {
        if (chr === ',') {
          return total + 1;
        }

        return total;
      }, 0);

      expect(commaCount).to.equal(1);
    });

    it('finds h1', function () {
      expect(this.result.indexOf('h1') > -1).to.equal(true);
    });

    it('finds p', function () {
      expect(this.result.indexOf('p') > -1).to.equal(true);
    });

    it('removes .unused-class-name', function () {
      expect(this.result.indexOf('.unused-class-name') === -1).to.equal(true);
    });
  });

  describe('removal of selectors', function () {
    beforeEach(function () {
      this.css = read('bootstrap/modified-bootstrap.css');
    });

    it('should only have .testFoo', function () {
      var css = this.css + read('camel_case/camel_case.css');
      var result = purify('testfoo', css);
      console.log(result.length);
      expect(result.length < 400).to.equal(true);
      expect(result.indexOf('.testFoo') > -1).to.equal(true);
    });
  });

  describe('pseudo classes', function () {
    beforeEach(function () {
      var content = read('pseudo_class/pseudo_class.js');
      var css = read('pseudo_class/pseudo_class.css');
      this.result = purify(content, css);
    });

    it('finds div:before', function () {
      expect(this.result.indexOf('div:before') > -1).to.equal(true);
    });

    it('removes row:after', function () {
      expect(this.result.indexOf('row:after') > -1).to.equal(false);
    });
  });
});
