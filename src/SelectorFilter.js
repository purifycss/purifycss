var RULE_TYPE = 'rule';
var MEDIA_TYPE = 'media';
var SELECTOR_EVENT = 'readSelectors';
var FINISH_READING_EVENT = 'finishedReading';

var SelectorFilter = function (contentWords) {
  this.contentWords = contentWords;
  this.rejectedSelectors = [];
};

SelectorFilter.prototype.initialize = function (CssSyntaxTree) {
  CssSyntaxTree.on(SELECTOR_EVENT, this.parseRule.bind(this));
  CssSyntaxTree.on(FINISH_READING_EVENT, this.removeEmptyRules.bind(this));
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

SelectorFilter.prototype.removeEmptyRules = function (rules) {
  var emptyRules = [];

  rules.forEach(function (rule) {
    var ruleType = rule.type;

    if (ruleType === RULE_TYPE && rule.selectors.length === 0) {
      emptyRules.push(rule);
    }

    if (ruleType === MEDIA_TYPE) {
      this.removeEmptyRules(rule.rules);
      if (rule.rules.length === 0) {
        emptyRules.push(rule);
      }
    }
  }.bind(this));

  emptyRules.forEach(function (emptyRule) {
    var index = rules.indexOf(emptyRule);
    rules.splice(index, 1);
  });
};

var getAllWordsInSelector = function (selector) {
  // Remove attr selectors. "a[href...]"" will become "a".
  selector = selector.replace(/\[(.+?)\]/g, '').toLowerCase();

  // If complex attr selector (has a bracket in it) just leave
  // the selector in. ¯\_(ツ)_/¯
  if (selector.indexOf('[') !== -1 || selector.indexOf(']') !== -1) {
    return [];
  }

  var words = [];
  var word = '';
  var skipNextWord = false;

  for (var i = 0; i < selector.length; i++) {
    var letter = selector[i];

    if (skipNextWord && (letter !== '.' || letter !== '#' || letter !== ' ')) {
      continue;
    }

    // If pseudoclass or universal selector, skip the next word
    if (letter === ':' || letter === '*') {
      addWord(words, word);
      word = '';
      skipNextWord = true;
      continue;
    }

    if (letter.match(/[a-z]+/)) {
      word += letter;
    } else {
      addWord(words, word);
      word = '';
      skipNextWord = false;
    }
  }

  words.push(word);
  return words;
};

var addWord = function (words, word) {
  if (word.length > 0) {
    words.push(word);
  }
};

module.exports = SelectorFilter;
