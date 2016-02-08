var startTime;
var beginningLength;

var PrintUtil = {

  printInfo: function (endingLength) {
    var logFn = console.error;
    logFn.call(null, '##################################');
    logFn.call(null, 'PurifyCSS has reduced the file size by ~' +
      (((beginningLength - endingLength) / beginningLength) * 100).toFixed(1) + '%');
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
