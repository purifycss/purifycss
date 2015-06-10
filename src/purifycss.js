var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var CleanCss = require('clean-css');
var CssSyntaxTree = require('./cssTree.js');

var htmlEls = ['a','abbr','acronym','address','applet','area','article','aside','audio','b','base','basefont','bdi','bdo','bgsound','big','blink','blockquote','body','br','button','canvas','caption','center','cite','code','col','colgroup','command','content','data','datalist','dd','del','details','dfn','dialog','dir','div','dl','dt','element','em','embed','fieldset','figcaption','figure','font','footer','form','frame','frameset','head','header','hgroup','hr','html','i','iframe','image','img','input','ins','isindex','kbd','keygen','label','legend','li','link','listing','main','map','mark','marquee','menu','menuitem','meta','meter','multicol','nav','nobr','noembed','noframes','noscript','object','ol','optgroup','option','output','p','param','picture','plaintext','pre','progress','q','rp','rt','rtc','ruby','s','samp','script','section','select','shadow','small','source','spacer','span','strike','strong','style','sub','summary','sup','table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','tt','u','ul','var','video','wbr','xmp'];

//////////////////////////////////////////////
// The main function is the "purify" function.
// Everything else is a helper
//////////////////////////////////////////////

var concatFiles = function(files){
  return files.reduce(function(total, file){
    return total + fs.readFileSync(file, 'utf8');
  }, '');
};

var getAllUsedWords = function(content){
  var used = {};
  var word = "";

  for(var i = 0; i < content.length; i++){
    var chr = content[i];

    if(chr.match(/^[\w-]+$/)){
      word += chr;
    } else {
      used[word] = true;
      word = "";
    }
  }

  return used;
};

var findWordsInWordHash = function(words, wordsHash){
  return _.filter(words, function(word){
    var splitWord = word.toLowerCase().split('-');

    if(splitWord.length === 1){
      return wordsHash[word];
    } else {
      return wordsHash[word] ||
             _.every(splitWord, function(part){
               return wordsHash[part] || wordsHash[part + '-'] ||
                      wordsHash['-' + part + '-'] || wordsHash['-' + part];
             });
    }
  });
};

var findSpecialInContent = function(selectors, content){
  return _.filter(selectors, function(selector){
    return content.indexOf(selector) > -1;
  });
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


var DEFAULT_OPTIONS = {
  write: false,
  minify: false,
  info: false
};
////////////////////
// ARGUMENTS
// files    = an array of filepaths to html/js files OR a raw string of content to search through
// css      = an array of filepaths to css files OR a raw string of css to filter
// options  = {
//   write  : string (filepath to write purified css to. if false, function returns raw string)
//   minify : boolean (if true, will minify the purified css)
//   info   : boolean (if true, will log out stats of how much css was reduced)
// }
////////////////////
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

  // Get hash of word-parts appearing in content
  var wordsInContent = getAllUsedWords(content);

  // Narrow list down to things that are found in content
  classes = findWordsInWordHash(tree.classes, wordsInContent);
  classes = classes.concat(findSpecialInContent(tree.specialClasses, content));
  var filteredHtmlEls = findWordsInWordHash(htmlEls, wordsInContent);
  ids = findWordsInWordHash(tree.ids, wordsInContent);
  ids = ids.concat(findSpecialInContent(tree.specialIds, content));

  // Narrow CSS tree down to things that remain on the list
  tree.filterSelectors(classes, filteredHtmlEls, ids);
  tree.filterAtRules(classes);

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
