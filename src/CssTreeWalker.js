var EventEmitter = require('events').EventEmitter;
var rework = require('rework');

var RULE_TYPE = 'rule';
var MEDIA_TYPE = 'media';

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
  this.removeEmptyRules(tree.rules);
};

CssTreeWalker.prototype.readRules = function (rules) {
  rules.forEach(function (rule) {
    var ruleType = rule.type;

    if (ruleType === RULE_TYPE) {
      this.emit('readRule', rule.selectors, rule);
    }

    if (ruleType === MEDIA_TYPE) {
      this.readRules(rule.rules);
    }
  }.bind(this));
};

CssTreeWalker.prototype.toString = function () {
  if (this.ast) {
    return this.ast.toString().replace(/,\n/g, ',');
  }

  return '';
};

CssTreeWalker.prototype.removeEmptyRules = function (rules) {
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

module.exports = CssTreeWalker;
