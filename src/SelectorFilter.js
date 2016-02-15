var getAllWordsInSelector = require('./utils/ExtractWordsUtil').getAllWordsInSelector;

function isWildcardWhitelistSelector(selector) {
  return selector[0] === '*' && selector[selector.length - 1] === '*';
}

function hasWhitelistMatch(selector, whitelist) {
  for (var i = 0; i < whitelist.length; i++) {
    if (selector.indexOf(whitelist[i]) !== -1) {
      return true;
    }
  }

  return false;
}

var SelectorFilter = function (contentWords, whitelist) {
  this.contentWords = contentWords;
  this.rejectedSelectors = [];
  this.wildcardWhitelist = [];

  this.parseWhitelist(whitelist);
};

SelectorFilter.prototype.initialize = function (CssSyntaxTree) {
  CssSyntaxTree.on('readRule', this.parseRule.bind(this));
};

SelectorFilter.prototype.parseWhitelist = function (whitelist) {
  whitelist.forEach(function (whitelistSelector) {
    whitelistSelector = whitelistSelector.toLowerCase();

    if (isWildcardWhitelistSelector(whitelistSelector)) {
      // If '*button*' then push 'button' onto list.
      this.wildcardWhitelist.push(
        whitelistSelector.substr(1, whitelistSelector.length - 2)
      );
    } else {
      getAllWordsInSelector(whitelistSelector).forEach(function (word) {
        this.contentWords[word] = true;
      }.bind(this));
    }
  }.bind(this));
};

SelectorFilter.prototype.parseRule = function (selectors, rule) {
  rule.selectors = this.filterSelectors(selectors);
};

SelectorFilter.prototype.filterSelectors = function (selectors) {
  var contentWords = this.contentWords;
  var rejectedSelectors = this.rejectedSelectors;
  var wildcardWhitelist = this.wildcardWhitelist;
  var usedSelectors = [];

  selectors.forEach(function (selector) {
    if (hasWhitelistMatch(selector, wildcardWhitelist)) {
      usedSelectors.push(selector);
      return;
    }

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
