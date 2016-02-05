var _ = require('underscore');
var fs = require('fs');

var CleanCss = require('clean-css');
var ContentSelectorExtraction = require('./ContentSelectorExtraction');
var CssSyntaxTree = require('../CssTreeWalker');
var SelectorFilter = require('../SelectorFilter');
var FileUtil = require('./utils/FileUtil');
var HTMLElements = require('./constants/HTMLElements');
var PrintUtil = require('./utils/PrintUtil');

////////////////////
// ARGUMENTS
// files    = an array of filepaths to html/js files OR a raw string of content to search through
// css      = an array of filepaths to css files OR a raw string of css to filter
// options  = (optional) {
//   write   : string (filepath to write purified css to. if false, function returns raw string)
//   minify  : boolean (if true, will minify the purified css)
//   info    : boolean (if true, will log out stats of how much css was reduced)
//   rejected: boolean (if true, will log out rejected css)
// }
// callback = (optional) a function that the purified css will be passed into
////////////////////

var DEFAULT_OPTIONS = {
  write: false,
  minify: false,
  info: false
};

var purify = function (searchThrough, css, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  options = _.extend({}, DEFAULT_OPTIONS, options);

  var cssString = Array.isArray(css) ? FileUtil.concatFiles(css) : css;
  var content = Array.isArray(searchThrough) ?
    FileUtil.concatFiles(searchThrough, {compress: true}) :
    FileUtil.compressCode(searchThrough);

  content = content.toLowerCase();

  // Save these to give helpful info at the end
  var beginningLength = cssString.length;
  var startTime = new Date();

  // Narrow list down to things that are found in content
  var extraction = new ContentSelectorExtraction(content);
  var selectorFilter = new SelectorFilter(extraction.contentWords);

  // Turn css into abstract syntax tree
  var tree = new CssSyntaxTree(cssString, [selectorFilter]);
  tree.beginReading();

  // // Turn tree back into css
  var source = tree.toString();

  if (options.minify) {
    source = new CleanCss().minify(source).styles;
  }

  if (options.info) {
    PrintUtil.printInfo(startTime, beginningLength, source.length);
  }

  if (options.rejected) {
    PrintUtil.printRejected(selectorFilter.rejectedSelectors);
  }

  if (!options.output) {
    return callback ? callback(source) : source;
  } else {
    fs.writeFile(options.output, source, function (err) {
      if (err) {
        return err;
      }
    });
  }
};

module.exports = purify;
