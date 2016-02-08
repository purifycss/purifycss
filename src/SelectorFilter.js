var getAllWordsInSelector = require('./utils/ExtractWordsUtil').getAllWordsInSelector;

var SelectorFilter = function (contentWords) {
  this.contentWords = contentWords;
  this.rejectedSelectors = [];
};

SelectorFilter.prototype.initialize = function (CssSyntaxTree) {
  CssSyntaxTree.on('readRule', this.parseRule.bind(this));
};

SelectorFilter.prototype.parseRule = function (selectors, rule) {
  rule.selectors = this.filterSelectors(selectors);
};

SelectorFilter.prototype.filterSelectors = function (selectors) {
  var contentWords = this.contentWords;
  var rejectedSelectors = this.rejectedSelectors;
  var usedSelectors = [];

  selectors.forEach(function (selector) {
    var words = getAllWordsInSelector(selector);
    var usedWords = words.filter(function (word) {
      return contentWords[word];
    });

    if (usedWords.length === words.length) {
      usedSelectors.push(selector);
    } else {
      rejectedSelectors.push(selector);
    }
  });

  return usedSelectors;
};

module.exports = SelectorFilter;
