var fs = require('fs');
var gonzales = require('gonzales');
var util = require('util');
var _ = require('underscore');
var cleanCss = require('clean-css');

//////////////////////////////////////////////
// The main function is the "purify" function.
// Everything else is a helper
//////////////////////////////////////////////

var concatFiles = function(files){
  return files.reduce(function(total, file){
    return total + fs.readFileSync(file, 'utf8');
  }, '');
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

var extractHTMLElementsFromContent = function(content){
  var htmlElements = require('./htmlEls.js');

  return _.filter(htmlElements, function(ele){
    return content.indexOf(ele) > -1;
  });
};

var extractClassesFromFlatCSS = function(json){
  var classes = [];

  for(var i = 0; i < json.length; i++){
    if(json[i] === 'clazz'){
      classes.push(json[i + 2]);
    }
  }

  return _.uniq(classes);
};

var extractIDsFromFlatCSS = function(json){
  var ids = [];

  for(var i = 0; i < json.length; i++){
    if(json[i] === 'shash'){
      ids.push(json[i + 1]);
    }
  }

  return _.uniq(ids);
};

var findClassesInFiles = function(classes, content){
  return _.filter(classes, function(className){

    // TODO: search for parts only if they keep showing up in css

    // we search for the prefix, middles, and suffixes
    // because if the prefix/middle/suffix can't be found, then
    // certainly the whole className can't be found.
    return contentHasPrefixSuffix(className, content);
  });
};

var contentHasPrefixSuffix = function(className, content){
  var split = className.split('-');

  if(split.length === 1){
    return content.indexOf(split[0]) > -1;
  }

  var i = 0;
  return _.some(split, function(part){
    if(i === 0){
      i++;
      return content.indexOf(part + '-') > -1;
    }

    if(i < split.length - 1){
      i++;
      return content.indexOf('-' + part + '-') > -1;
    }

    if(i === split.length - 1){
      i++;
      return content.indexOf('-' + part) > -1;
    }
  });
};

var filterByUsedClassesAndHtmlEls = function(ast, classes, htmlEls){
  return _.filter(ast, function(branch){
    var flatBranch = _.flatten(branch.slice());
    if(flatBranch[0] === 's'){
      return true;
    }

    for(var i = 0; i < flatBranch.length; i++){
      if(flatBranch[i] === 'clazz'){
        return classes.indexOf(flatBranch[i + 2]) > -1;
      }
    }

    for(var i = 0; i < flatBranch.length; i++){
      if(flatBranch[i] === 'ident' && htmlEls.indexOf(flatBranch[i + 1]) > -1){
        return true;
      }
    }

    return false;
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
        return ids.indexOf(flatBranch[i + 1]) > -1;
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

    for(var i = 1; i < branch.length; i++){
      if(branch[i][0] !== 'atrulers'){
        continue;
      }

      // console.log(util.inspect(twig, false, null));
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
var purify = function(files, css, options){
  if(options){
    options = _.extend({}, DEFAULT_OPTIONS, options);
  } else {
    options = DEFAULT_OPTIONS;
  }

  var cssString = Array.isArray(css) ? concatFiles(css) : css;
  var content = Array.isArray(files) ? concatFiles(files) : files;

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

  // console.log(util.inspect(original, false, null));

  var flattenedCSS = _.flatten(original.slice());

  // Get list of things that are actually used
  var classes = extractClassesFromFlatCSS(flattenedCSS);
  var ids = extractIDsFromFlatCSS(flattenedCSS);
  var htmlEls = extractHTMLElementsFromContent(content);
  
  // Narrow tree down to stuff that is used
  classes = findClassesInFiles(classes, content);
  var stylesheet = filterByUsedClassesAndHtmlEls(original, classes, htmlEls);
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
    styles = new cleanCss().minify(styles).styles;
  }

  if(options.info){
    console.log('##################################');
    console.log('Before purify, CSS was ' + beginningLength + ' chars long.');
    console.log('After purify, CSS is ' + styles.length + ' chars long. (' +
      Math.floor((beginningLength / styles.length * 10)) / 10  + ' times smaller)');
    console.log('##################################');
  }

  if(!options.output){
    return styles
  } else {
    fs.writeFile(options.output, styles, function(err){
      if(err) return err;
    });
  }
};

module.exports = purify;
