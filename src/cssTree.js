var gonzales = require('gonzales');
var _ = require('underscore');
var util = require('util');

var CssTree = function(cssString){
  var ast = gonzales.srcToCSSP(cssString);

  this.selectors = null;
  this.atRulesTree = null;

  this.classes = null;
  this.specialClasses = null;
  this.ids = null;
  this.specialIds = null;
  this.attrSelectors = null;

  this.initialize(ast);
};

module.exports = CssTree;

CssTree.prototype.initialize = function(ast){
  // Everything that begins with @ in css (@media, @keyframe, etc.)
  this.atRulesTree = _.filter(ast, function(branch){
    return branch[0] === 'atruler' || branch[0] === 's';
  });

  // Tree with everything that doesn't start with an @ (classes, elements, ids, etc.)
  this.selectors = _.filter(ast, function(branch){
    return branch[0] !== 'atruler';
  });
  
  var ids = [];
  var classes = [];
  var css = _.flatten(ast.slice());
  var attrSelectors = [];

  for(var i = 0; i < css.length; i++){
    if(css[i] === 'clazz'){
      classes.push(css[i + 2].toLowerCase());
    }

    if(css[i] === 'attrselector'){
      attrSelectors.push(css[i + 3].toLowerCase());
    }

    if(css[i] === 'shash'){
      ids.push(css[i + 1].toLowerCase());
    }
  }

  attrSelectors = _.uniq(attrSelectors);
  ids = _.uniq(ids);
  var normalClasses = [];
  var specialClasses = [];
  var normalIds = [];
  var specialIds = [];

  // Remove first and last quotes
  attrSelectors = attrSelectors.map(function(attrselector) {
    return attrselector.replace(/^"(.+(?="$))"$/, '$1');
  });

  classes.forEach(function(selector){
    if(selector.match(/^[\w-]+$/)){
      normalClasses.push(selector);
    } else {
      specialClasses.push(selector);
    }
  });

  ids.forEach(function(selector){
    if(selector.match(/^[\w-]+$/)){
      normalIds.push(selector);
    } else {
      specialIds.push(selector);
    }
  });


  this.ids = _.uniq(normalIds);
  this.specialIds = _.uniq(specialIds);
  this.classes = _.uniq(normalClasses);
  this.specialClasses = _.uniq(specialClasses);
  this.attrSelectors = attrSelectors;
};

CssTree.prototype.filterSelectors = function(classes, htmlEls, ids, attrSelectors){
  this.selectors.forEach(function(branch){
    if(branch[0] !== 'ruleset'){
      return;
    }

    for(var i = 1; i < branch.length; i++){
      if(branch[i][0] !== 'selector'){
        continue;
      }

      branch[i] = filterSelector(branch[i], classes, htmlEls, ids, attrSelectors);
    }
  });

  this.selectors =  _.filter(this.selectors, function(branch){
    if(branch[0] !== 'ruleset'){
      return true;
    }

    var flatBranch = _.flatten(branch);
    return flatBranch.indexOf('simpleselector') > -1;
  });
};

CssTree.prototype.filterAtRules = function(classes, htmlEls, ids, attrSelectors){
  this.atRulesTree.forEach(function(branch){
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

      for(var j = 1; j < branch[i].length; j++){
        var twig = branch[i][j];

        if(twig[0] !== 'ruleset'){
          continue;
        }

        for(var k = 0; k < twig.length; k++){
          var miniTwig = twig[k];

          if(miniTwig[0] !== 'selector'){
            continue;
          }

          branch[i][j][k] = filterSelector(miniTwig, classes, htmlEls, ids, attrSelectors);
        }
      }

      branch[i] = _.filter(branch[i], function(twig){
        if(twig[0] !== 'ruleset'){
          return true;
        }

        var flatTwig = _.flatten(twig);
        return flatTwig.indexOf('simpleselector') > -1;
      });
    }
  });

  this.removeEmptyAtRules();
};

CssTree.prototype.removeEmptyAtRules = function(){
  this.atRulesTree =  _.filter(this.atRulesTree, function(branch){
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

CssTree.prototype.toSrc = function(){
  var classStyles = gonzales.csspToSrc(this.selectors);
  var atStyles = gonzales.csspToSrc(this.atRulesTree);

  // Combine and format
  var styles = classStyles + '\n' + atStyles + '\n';
  return JSON.parse(formatCSS(JSON.stringify(styles)));
};

var validateId = function(flatTwig, ids){
  for(var i = 0; i < flatTwig.length; i++){
    if(flatTwig[i] === 'shash'){
      if(ids.indexOf(flatTwig[i + 1].toLowerCase()) === -1){
        throwDelim = true;
        return false;
      }
    }
  }
  return true;
};

var validateClass = function(flatTwig, classes){
  for(var i = 1; i < flatTwig.length; i++){
    if(flatTwig[i] === 'clazz'){
      if(classes.indexOf(flatTwig[i + 2].toLowerCase()) === -1){
        return false;
      }
    }
  }
  return true;
};

var validateHtmlTag = function(flatTwig, htmlEls){
  for(var i = 1; i < flatTwig.length; i++){
    if(flatTwig[i] === 'ident' && htmlEls.indexOf(flatTwig[i + 1]) > -1){
      return true;
    }
  }
  return false;
};

var filterSelector = function(branch, classes, htmlEls, ids, attrSelectors){
  var throwDelim = false;

  var output = _.filter(branch, function(twig){
    var flatTwig = _.flatten(twig);

    if(flatTwig[0] === 'delim' && throwDelim){
      throwDelim = false;
      return false;
    }

    if(flatTwig[0] !== 'simpleselector'){
      return true;
    }

    if (flatTwig.indexOf('pseudoe') > -1 || flatTwig.indexOf('*') > -1 || flatTwig.indexOf('pseudoc') > -1) {
      return true;
    }

    var isAttrSelector = flatTwig.indexOf('attrselector') > -1;
    if (isAttrSelector) {
      for(var k = 0; k < flatTwig.length; k++){
        if(flatTwig[k] === 'attrselector'){
          var attrvalue = flatTwig[k + 3].toLowerCase().replace(/^"(.+(?="$))"$/, '$1');
          if(attrSelectors.indexOf(attrvalue) === -1){
            throwDelim = true;
            return false;
          }
        }
      }
      return true;
    }

    var isId = flatTwig.indexOf('shash') > -1;
    if(isId){
      var validated = validateId(flatTwig, ids);
      throwDelim = !validated;
      return validated;
    }

    var hasClass = flatTwig.indexOf('clazz') > -1;
    if(hasClass){
      var validated = validateClass(flatTwig, classes);
      throwDelim = !validated;
      return validated
    } else {
      var validated = validateHtmlTag(flatTwig, htmlEls);
      throwDelim = !validated;
      return validated;
    }

    return true;
  });

  if(output[output.length - 1][0] === 'delim'){
    output = output.slice(0, output.length - 1);
  }

  return output;
};