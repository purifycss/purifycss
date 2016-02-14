var fs = require('fs');

var CleanCss = require('clean-css');
var getAllWordsInContent = require('./utils/ExtractWordsUtil').getAllWordsInContent;
var CssTreeWalker = require('./CssTreeWalker');
var FileUtil = require('./utils/FileUtil');
var PrintUtil = require('./utils/PrintUtil');
var SelectorFilter = require('./SelectorFilter');

////////////////////
// ARGUMENTS
// files    = an array of filepaths to html/js files OR a raw string of content to search through
// css      = an array of filepaths to css files OR a raw string of css to filter
// options  = (optional) {
//   output  : string (filepath to write purified css to. if false, function returns raw string)
//   minify  : boolean (if true, will minify the purified css)
//   info    : boolean (if true, will log out stats of how much css was reduced)
//   rejected: boolean (if true, will log out rejected css)
// }
// callback = (optional) a function that the purified css will be passed into
////////////////////

var getOptions = function (options) {
  options = options || {};
  var defaultOptions = {
    output: false,
    minify: false,
    info: false,
    whitelist: []
  };

  Object.keys(options).forEach(function (option) {
    defaultOptions[option] = options[option];
  });

  return defaultOptions;
};

var minify = function (cssSource) {
  return new CleanCss().minify(cssSource).styles;
};

var purify = function (searchThrough, css, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = getOptions(options);

  var cssString = FileUtil.filesToSource(css, 'css');
  var content = FileUtil.filesToSource(searchThrough, 'content');

  PrintUtil.startLog(minify(cssString).length);

  var wordsInContent = getAllWordsInContent(content);

  var selectorFilter = new SelectorFilter(wordsInContent, options.whitelist);

  var tree = new CssTreeWalker(cssString, [selectorFilter]);
  tree.beginReading();
  var source = tree.toString();

  if (options.minify) {
    source = minify(source);
  }

  if (options.info && options.minify) {
    PrintUtil.printInfo(source.length);
  } else if (options.info && !options.minify) {
    PrintUtil.printInfo(minify(source).length);
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
