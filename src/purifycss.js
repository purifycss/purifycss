var _ = require('underscore');
var fs = require('fs');

var CleanCss = require('clean-css');
var ContentSelectorExtraction = require('./ContentSelectorExtraction.js');
var CssSyntaxTree = require('./CssSyntaxTree.js');
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

  // Turn css into abstract syntax tree
  var tree = new CssSyntaxTree(cssString);

  // Narrow list down to things that are found in content
  var extraction = new ContentSelectorExtraction(content);
  var classes = extraction.filter(tree.classes);
  var specialClasses = extraction.filterBySearch(tree.specialClasses);
  var ids = extraction.filter(tree.ids);
  var specialIds = extraction.filterBySearch(tree.specialIds);
  var attrSelectors = extraction.filterBySearch(tree.attrSelectors);

  classes = classes.concat(specialClasses);
  ids = ids.concat(specialIds);
  var usedHtmlEls = extraction.filter(HTMLElements);

  // Narrow CSS tree down to things that remain on the list
  var rejectedSelectorTwigs = tree.filterSelectors(classes, usedHtmlEls, ids, attrSelectors);
  var rejectedAtRuleTwigs = tree.filterAtRules(classes, usedHtmlEls, ids, attrSelectors);

  // Turn tree back into css
  var source = tree.toSrc();

  if (options.minify) {
    source = new CleanCss().minify(source).styles;
  }

  if (options.info) {
    PrintUtil.printInfo(startTime, beginningLength, source.length);
  }

  if (options.rejected) {
    PrintUtil.printRejected(rejectedSelectorTwigs.concat(rejectedAtRuleTwigs));
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
