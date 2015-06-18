var _ = require('underscore');

var Extraction = function(content){
  this.content = content;

  // Get hash of word-parts appearing in content
  this.contentWords = getAllUsedWords(content);
};

module.exports = Extraction;

Extraction.prototype.filter = function(words){
  var that = this;

  return _.filter(words, function(word){
    var splitWord = word.toLowerCase().split('-');

    if(splitWord.length === 1){
      return that.contentWords[word];
    } else {
      return that.contentWords[word] ||
             _.every(splitWord, function(part){
               return that.contentWords[part] || that.contentWords[part + '-'] ||
                      that.contentWords['-' + part + '-'] || that.contentWords['-' + part];
             });
    }
  });
};

Extraction.prototype.filterBySearch = function(words){
  var that = this;

  return _.filter(words, function(word){
    return that.content.indexOf(word.replace(/\\/g, '')) > -1;
  });
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

  used[word] = true;

  return used;
};