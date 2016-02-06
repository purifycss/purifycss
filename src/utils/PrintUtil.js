var startTime;
var beginningLength;

var PrintUtil = {

  printInfo: function (endingLength) {
    var logFn = console.error;
    logFn.call(null, '##################################');
    logFn.call(null, 'Before purify, CSS was ' + beginningLength + ' chars long.');
    logFn.call(null, 'After purify, CSS is ' + endingLength + ' chars long. (' +
      Math.floor((beginningLength / endingLength * 10)) / 10 + ' times smaller)');
    logFn.call(null, '##################################');
    logFn.call(null, 'This function took: ', new Date() - startTime, 'ms');
  },

  printRejected: function (rejectedTwigs) {
    var logFn = console.error;
    logFn.call(null, '##################################');
    logFn.call(null, 'Rejected selectors:');
    logFn.call(null, rejectedTwigs.join('\n'));
    logFn.call(null, '##################################');
  },

  startLog: function (cssLength) {
    startTime = new Date();
    beginningLength = cssLength;
  }

};

module.exports = PrintUtil;
