var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var CleanCss = require('clean-css');
var CssSyntaxTree = require('./cssTree.js');
var Extraction = require('./extraction.js');

////////////////////
// ARGUMENTS
// files    = an array of filepaths to html/js files OR a raw string of content to search through
// css      = an array of filepaths to css files OR a raw string of css to filter
// options  = (optional) {
//   write  : string (filepath to write purified css to. if false, function returns raw string)
//   minify : boolean (if true, will minify the purified css)
//   info   : boolean (if true, will log out stats of how much css was reduced)
// }
// callback = (optional) a function that the purified css will be passed into
////////////////////

var DEFAULT_OPTIONS = {
  write: false,
  minify: false,
  info: false
};

var purify = function(files, css, options, callback){
  if(typeof options === 'function'){
    callback = options;
    options = {};
  }
  options = options || {};
  options = _.extend({}, DEFAULT_OPTIONS, options);

  var cssString = Array.isArray(css) ? concatFiles(css) : css;
  var content = Array.isArray(files) ? concatFiles(files) : files;
  content = reduceContent(content.toLowerCase());

  // Save these to give helpful info at the end
  var beginningLength = cssString.length;
  var startTime = new Date();

  // Turn css into abstract syntax tree
  var tree = new CssSyntaxTree(cssString);

  // Narrow list down to things that are found in content
  var extraction = new Extraction(content, tree);

  // Narrow CSS tree down to things that remain on the list
  tree.filterSelectors(extraction.classes, extraction.htmlEls, extraction.ids);
  tree.filterAtRules(extraction.classes);

  // Turn tree back into css
  styles = tree.toSrc();

  if(options.minify){
    styles = new CleanCss().minify(styles).styles;
  }

  if(options.info){
    printInfo(startTime, beginningLength);
  }

  if(!options.output){
    if(callback){
      return callback(styles);
    } else {
      return styles
    }
  } else {
    fs.writeFile(options.output, styles, function(err){
      if(err) return err;
    });
  }
};

module.exports = purify;

var concatFiles = function(files){
  return files.reduce(function(total, file){
    return total + fs.readFileSync(file, 'utf8');
  }, '');
};

var reduceContent = function(content){
  return content
    .split('\n').join('')
    .replace(/\s\s+/g, ' ');
};

var printInfo = function(startTime, beginningLength){
  console.log('##################################');
  console.log('Before purify, CSS was ' + beginningLength + ' chars long.');
  console.log('After purify, CSS is ' + styles.length + ' chars long. (' +
    Math.floor((beginningLength / styles.length * 10)) / 10  + ' times smaller)');
  console.log('##################################');
  console.log('This function took: ', new Date() - startTime, 'ms');
};
