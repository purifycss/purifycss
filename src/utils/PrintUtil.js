var getRuleString = function(twig){
  var ruleString = '';
  for(var i = 1; i < twig.length; i++){
    var rulePart = twig[i];
    switch (rulePart[0]) {
    case 's':
      ruleString += rulePart[1] !== '\n' ? rulePart[1] : '';
      break;
    case 'clazz':
      ruleString += '.' + rulePart[1][1];
      break;
    case 'shash':
      ruleString += '#' + rulePart[1];
      break;
    case 'ident':
      ruleString += rulePart[1];
      break;
    case 'attrib':
      ruleString += '[' + rulePart[1][1] + ']';
      break;
    default:
      ruleString += 'Unsupported: ' + JSON.stringify(twig);
    }
  }
  return ruleString;
};


var PrintUtil = {

  printInfo: function(startTime, beginningLength, endingLength){
    var logFn = console.error;
    logFn.call(null, '##################################');
    logFn.call(null, 'Before purify, CSS was ' + beginningLength + ' chars long.');
    logFn.call(null, 'After purify, CSS is ' + endingLength + ' chars long. (' +
      Math.floor((beginningLength / endingLength * 10)) / 10  + ' times smaller)');
    logFn.call(null, '##################################');
    logFn.call(null, 'This function took: ', new Date() - startTime, 'ms');
  },

  printRejected: function(rejectedTwigs){
    var logFn = console.error;
    logFn.call(null, '##################################');
    logFn.call(null, 'Rejected selectors:');
    logFn.call(null, _.map(rejectedTwigs, getRuleString).join('\n'));
    logFn.call(null, '##################################');
  }

};

module.exports = PrintUtil;
