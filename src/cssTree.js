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

  for(var i = 0; i < css.length; i++){
    if(css[i] === 'clazz'){
      classes.push(css[i + 2]);
    }

    if(css[i] === 'shash'){
      ids.push(css[i + 1]);
    }
  }

  ids = _.uniq(ids);
  var normalClasses = [];
  var specialClasses = [];
  var normalIds = [];
  var specialIds = [];

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
};

CssTree.prototype.filterSelectors = function(classes, htmlEls, ids){
  this.selectors.forEach(function(branch){
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

        var isId = flatTwig.indexOf('shash') > -1;
        if(isId){
          for(var k = 0; k < flatTwig.length; k++){
            if(flatTwig[k] === 'shash'){
              if(ids.indexOf(flatTwig[k + 1].toLowerCase()) === -1){
                throwDelim = true;
                return false;
              }
            }
          }
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

  this.selectors =  _.filter(this.selectors, function(branch){
    if(branch[0] !== 'ruleset'){
      return true;
    }

    var flatBranch = _.flatten(branch);
    return flatBranch.indexOf('simpleselector') > -1;
  });
};

CssTree.prototype.filterAtRules = function(classes){
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
