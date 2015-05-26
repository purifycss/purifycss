var fs = require('fs');
var gonzales = require('gonzales');
var util = require('util');
var _ = require('underscore');
var cleanCss = require('clean-css');

var concatFiles = function(files){
  return files.reduce(function(total, file){
    return total + fs.readFileSync(file, 'utf8');
  }, '');
};

var uncss = function(files, css, writeTo, options){
  var cssString = concatFiles(css);
  var content = concatFiles(files);

  var original = gonzales.srcToCSSP(cssString);
  var atSign = _.filter(original, function(branch){
    return branch[0] === 'atruler' || branch[0] === 's';
  });

  console.log(util.inspect(original, false, null));

  original = _.filter(original, function(branch){
    return branch[0] !== 'atruler';
  });

  var json = original.slice();
  json = _.flatten(json);


  var classes = extractClassesFromFlatCSS(json);
  var htmlEls = extractHTMLElementsFromContent(content);
  var ids = extractIDsFromFlatCSS(json);
  classes = findClassesInFiles(classes, content);

  var stylesheet = _.filter(original, function(branch){
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

  ids = _.filter(original, function(branch){
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

  atSign = _.filter(atSign, function(branch){
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

  var idStyles = gonzales.csspToSrc(ids);
  var classStyles = gonzales.csspToSrc(stylesheet);
  var atStyles = gonzales.csspToSrc(atSign);
  var styles = classStyles + '\n' + atStyles + '\n' + idStyles;

  fs.writeFile(writeTo, styles, function(err){
    if(err) return err;

    var styleFile = fs.readFileSync(writeTo, 'utf8');
    var json = JSON.stringify(styleFile);
    var styless = formatCSS(json);
    
    if(options && options.minify){
      var finalStyle = new cleanCss().minify(JSON.parse(styless)).styles;
    } else {
      var finalStyle = JSON.parse(styless);
    }

    fs.writeFile(writeTo, finalStyle, function(){
      console.log('');
      console.log('FINISHED MAKING STYLES ANOREXIC!!');
      console.log('SOMEBODY GIVE THESE STYLESHEETS A BURGER, THEY\'RE SO SKINNY');
      console.log('');
    });
  });
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

// EXAMPLE API FOR THE FUNCTION
// uncss(
//   ['reddit.html', 'reddit.js', 'reddit2.js'], // LIST OF FILES TO CHECK FOR CLASSES
//   ['reddit.css', 'subreddit.css', 'thebutton.css'], // LIST OF CSS FILES TO EXTRACT CLASSES
//   'purifiedreddit.css', // OUTPUT FILE
//   {
//     minify: true
//   }
// );
