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

var formatCSS = function(styless){
  styless = styless.split('\\n\\n').join('');
  styless = styless.split(' \\n').join('');
  styless = styless.split('   ').join('');
  styless = styless.split('}').join('}\\n');
  styless = styless.split('}\\n\\n').join('}\\n');
  styless = styless.split(' }').join('}');
  styless = styless.split(' }').join('}');

  return styless;
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
    return content.indexOf(className) > -1;
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
  minify: false
};

var purify = function(files, css, options){
  if(options){
    _.extend(DEFAULT_OPTIONS, options);
  }
  options = DEFAULT_OPTIONS;

  var cssString = Array.isArray(css) ? concatFiles(css) : css;
  var content = Array.isArray(files) ? concatFiles(files) : files;

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

  if(!options.output){
    return styles
  } else {
    fs.writeFile(options.output, styles, function(err){
      if(err) return err;

      console.log('');
      console.log('FINISHED MAKING STYLES ANOREXIC!!');
      console.log('SOMEBODY GIVE THESE STYLESHEETS A BURGER, THEY\'RE SO SKINNY');
      console.log('');
    });
  }
};

// EXAMPLE API FOR THE FUNCTION
// purify(
//   ['reddit.html', 'reddit.js', 'reddit2.js'], // LIST OF FILES TO CHECK FOR CLASSES
//   ['reddit.css', 'subreddit.css', 'thebutton.css'], // LIST OF CSS FILES TO EXTRACT CLASSES
//   'purifiedreddit.css', // OUTPUT FILE
//   {
//     minify: true
//     write: false
//   }
// );

module.exports = purify;