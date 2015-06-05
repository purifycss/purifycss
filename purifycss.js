var fs = require('fs');
var gonzales = require('gonzales');
var util = require('util');
var _ = require('underscore');
var CleanCss = require('clean-css');

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

var getAllUsedCharactersInClasses = function(classes){
  var usedChars = {};

  classes.forEach(function(selector){
    for(var i = 0; i < selector.length; i++){
      var chr = selector[i];
      usedChars[chr] = true;
    }
  });

  return usedChars;
};

var getAllUsedWords = function(content, usedChars){
  var used = {};
  var word = "";

  for(var i = 0; i < content.length; i++){
    var chr = content[i];

    if(chr in usedChars){
      word += chr;
    } else {
      used[word] = true;
      word = "";
    }
  }

  return used;
};

var formatCSS = function(styles){
  styles = styles.split('\\n\\n').join('');
  styles = styles.split(' \\n').join('');
  styles = styles.split('   ').join('');
  styles = styles.split('}').join('}\\n');
  styles = styles.split('}\\n\\n').join('}\\n');
  styles = styles.split(' }').join('}');
  styles = styles.split(' }').join('}');

  return styles;
};

var extractIDsAndClassesFromCSS = function(css){
  var ids = [];
  var classes = [];

  for(var i = 0; i < css.length; i++){
    if(css[i] === 'clazz'){
      classes.push(css[i + 2]);
    }

    if(css[i] === 'shash'){
      ids.push(css[i + 1]);
    }
  }

  ids = _.uniq(ids);
  classes = _.uniq(classes);

  return {
    ids: ids,
    classes: classes
  };
};

var findWordsInWordHash = function(words, wordsHash){
  return _.filter(words, function(word){
    var splitWord = word.split('-');

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

var filterByUsedClassesAndHtmlEls = function(ast, classes, htmlEls){
  ast.forEach(function(branch){
    if(branch[0] !== 'ruleset'){
      return;
    }

    for(var i = 1; i < branch.length; i++){
      if(branch[i][0] !== 'selector'){
        continue;
      }

      var throwDelim = false;
      branch[i] = _.filter(branch[i], function(twig){
        var flatTwig = _.flatten(twig);

        if(flatTwig[0] === 'delim' && throwDelim){
          throwDelim = false;
          return false;
        }

        if(flatTwig[0] !== 'simpleselector'){
          return true;
        }

        var hasClass = flatTwig.indexOf('clazz') > -1;

        if(hasClass){
          for(var j = 1; j < flatTwig.length; j++){
            if(flatTwig[j] === 'clazz'){
              if(classes.indexOf(flatTwig[j + 2]) === -1){
                throwDelim = true;
                return false;
              }
            }
          }
        } else {
          for(var j = 1; j < flatTwig.length; j++){
            if(flatTwig[i] === 'ident' && htmlEls.indexOf(flatTwig[i + 1]) > -1){
              return true;
            }
          }

          throwDelim = true;
          return false;
        }

        return true;
      });

      if(branch[i][branch[i].length - 1][0] === 'delim'){
        branch[i] = branch[i].slice(0, branch[i].length - 1);
      }
    }
  });

  return _.filter(ast, function(branch){
    if(branch[0] !== 'ruleset'){
      return true;
    }

    var flatBranch = _.flatten(branch);
    return flatBranch.indexOf('simpleselector') > -1;
  });
};

var filterByUsedIds = function(ast, ids){
  return _.filter(ast, function(branch){
    var flatBranch = _.flatten(branch.slice());

    if(flatBranch[0] === 's'){
      return true;
    }

    for(var i = 0; i < flatBranch.length; i++){
      if(flatBranch[i] === 'shash'){
        return ids.indexOf(flatBranch[i + 1].toLowerCase()) > -1;
      }
    }

    return false;
  });
};

var removeUnusedMedias = function(atSign, classes){
  atSign.forEach(function(branch){
    if(branch[0] !== 'atruler'){
      return;
    }

    if(_.flatten(branch).indexOf('media') === -1){
      return;
    }
    for(var i = 1; i < branch.length; i++){
      if(branch[i][0] !== 'atrulers'){
        continue;
      }

      branch[i] = _.filter(branch[i], function(twig){
        if(twig[0] !== 'ruleset'){
          return true;
        }
        var flattened = _.flatten(twig);
        var flag = false;

        for(var j = 0; j < flattened.length; j++){
          if(flattened[j] === 'clazz'){
            if(classes.indexOf(flattened[j + 2]) > -1){
              flag = true;
            } else {
              return false;
            }
          }
        }

        return flag;
      });
    }
  });
};

var filterMediasByZeroClasses = function(atSign){
  return _.filter(atSign, function(branch){
    if(branch[0] !== 'atruler'){
      return true;
    }

    var flatBranch = _.flatten(branch);
    var count = 0;

    for(var i = 0; i < flatBranch.length; i++){
      if(flatBranch[i] === 'property'){
        count++;
      }
    }

    return count > 0;
  });
};

var reduceContent = function(content){
  return content
    .split('\n').join('')
    .replace(/\s\s+/g, ' ');
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

  var startTime = new Date();

  var cssString = Array.isArray(css) ? concatFiles(css) : css;
  var content = Array.isArray(files) ? concatFiles(files) : files;
  content = reduceContent(content.toLowerCase());

  // Store starting length. Will be helpful later to show how much was reduced
  var beginningLength = cssString.length;

  // Turn css into abstract syntax tree
  var original = gonzales.srcToCSSP(cssString);

  // Tree with everything that begins with @ in css (@media, @keyframe, etc.)
  var atSign = _.filter(original, function(branch){
    return branch[0] === 'atruler' || branch[0] === 's';
  });

  // Tree with everything that doesn't start with an @ (classes, elements, ids, etc.)
  original = _.filter(original, function(branch){
    return branch[0] !== 'atruler';
  });

  // console.log(util.inspect(atSign, false, null));

  var flattenedCSS = _.flatten(original.slice());

  // Get list of things that are used
  var extraction = extractIDsAndClassesFromCSS(flattenedCSS);
  var classes = extraction.classes;
  var ids = extraction.ids;

  // Get hash of word-parts appearing in content
  var chrHash = getAllUsedCharactersInClasses(classes);
  var wordsInContent = getAllUsedWords(content, chrHash);

  // Narrow list down to things that are found in content
  classes = findWordsInWordHash(classes, wordsInContent);
  var filteredHtmlEls = findWordsInWordHash(htmlEls, wordsInContent);
  ids = findWordsInWordHash(ids, wordsInContent);

  // Narrow CSS tree down to things that remain on the list
  var stylesheet = filterByUsedClassesAndHtmlEls(original, classes, filteredHtmlEls);
  ids = filterByUsedIds(original, ids);
  removeUnusedMedias(atSign, classes);
  atSign = filterMediasByZeroClasses(atSign);

  // Turn tree back into css
  var idStyles = gonzales.csspToSrc(ids);
  var classStyles = gonzales.csspToSrc(stylesheet);
  var atStyles = gonzales.csspToSrc(atSign);

  // Combine and format
  var styles = classStyles + '\n' + atStyles + '\n' + idStyles;
  styles = JSON.parse(formatCSS(JSON.stringify(styles)));

  if(options.minify){
    styles = new CleanCss().minify(styles).styles;
  }

  if(options.info){
    console.log('##################################');
    console.log('Before purify, CSS was ' + beginningLength + ' chars long.');
    console.log('After purify, CSS is ' + styles.length + ' chars long. (' +
      Math.floor((beginningLength / styles.length * 10)) / 10  + ' times smaller)');
    console.log('##################################');
    console.log('This function took: ', new Date() - startTime, 'ms');
  }

  if(!options.output){
    if(callback){
      callback(styles);
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
