var EventEmitter = require('events').EventEmitter;
var rework = require('rework');

var ReworkTypes = require('./src/constants/ReworkTypes');
var EventTypes = require('./src/constants/EventTypes');

var CssTreeWalker = function (code, plugins) {
  EventEmitter.call(this);
  this.startingSource = code;
  this.ast = null;

  plugins.forEach(function (plugin) {
    plugin.initialize(this);
  }.bind(this));
};

CssTreeWalker.prototype = Object.create(EventEmitter.prototype);
CssTreeWalker.prototype.constructor = CssTreeWalker;

CssTreeWalker.prototype.beginReading = function () {
  this.ast = rework(this.startingSource)
    .use(this.readPlugin.bind(this));
};

CssTreeWalker.prototype.readPlugin = function (tree) {
  this.readRules(tree.rules);
  this.finishReading(tree.rules);
};

CssTreeWalker.prototype.readRules = function (rules) {
  rules.forEach(function (rule) {
    var ruleType = rule.type;

    if (ruleType === ReworkTypes.RULE_TYPE) {
      this.emit(EventTypes.READ_SELECTOR, rule.selectors, rule);
    }

    if (ruleType === ReworkTypes.MEDIA_TYPE) {
      this.readRules(rule.rules);
    }
  }.bind(this));
};

CssTreeWalker.prototype.toString = function () {
  if (this.ast) {
    return this.ast.toString();
  }

  return '';
};

CssTreeWalker.prototype.finishReading = function (rules) {
  this.emit(EventTypes.FINISH_READING, rules);
};

module.exports = CssTreeWalker;
