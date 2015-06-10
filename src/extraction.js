var _ = require('underscore');

var htmlEls = ['a','abbr','acronym','address','applet','area','article','aside','audio','b','base','basefont','bdi','bdo','bgsound','big','blink','blockquote','body','br','button','canvas','caption','center','cite','code','col','colgroup','command','content','data','datalist','dd','del','details','dfn','dialog','dir','div','dl','dt','element','em','embed','fieldset','figcaption','figure','font','footer','form','frame','frameset','head','header','hgroup','hr','html','i','iframe','image','img','input','ins','isindex','kbd','keygen','label','legend','li','link','listing','main','map','mark','marquee','menu','menuitem','meta','meter','multicol','nav','nobr','noembed','noframes','noscript','object','ol','optgroup','option','output','p','param','picture','plaintext','pre','progress','q','rp','rt','rtc','ruby','s','samp','script','section','select','shadow','small','source','spacer','span','strike','strong','style','sub','summary','sup','table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','tt','u','ul','var','video','wbr','xmp'];

var Extraction = function(content, tree){
  // Get hash of word-parts appearing in content
  this.contentWords = getAllUsedWords(content);

  var classes = findWordsInWordHash(tree.classes, this.contentWords);
  this.classes = classes.concat(findSpecialInContent(tree.specialClasses, content));

  this.htmlEls = findWordsInWordHash(htmlEls, this.contentWords);

  var ids = findWordsInWordHash(tree.ids, this.contentWords);
  this.ids = ids.concat(findSpecialInContent(tree.specialIds, content));
};

module.exports = Extraction;

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
