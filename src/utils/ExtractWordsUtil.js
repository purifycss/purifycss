var addWord = function (words, word) {
  if (word.length > 0) {
    words.push(word);
  }
};

var ExtractWordsUtil = {
  getAllWordsInContent: function (content) {
    var used = {
      // Always include html and body.
      html: true,
      body: true
    };
    var word = '';

    for (var i = 0; i < content.length; i++) {
      var chr = content[i];

      if (chr.match(/[a-z]+/)) {
        word += chr;
      } else {
        used[word] = true;
        word = '';
      }
    }

    used[word] = true;

    return used;
  },

  getAllWordsInSelector: function (selector) {
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

    addWord(words, word);
    return words;
  }
};

module.exports = ExtractWordsUtil;
