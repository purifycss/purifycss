import CleanCss from 'clean-css';
import rework from 'rework';
import glob from 'glob';

var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}
// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active && !(this instanceof domain.Domain)) {
      this.domain = domain.active;
    }
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var needDomainExit = false;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  if (needDomainExit)
    domain.exit();

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();









var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var RULE_TYPE = "rule";
var MEDIA_TYPE = "media";

var CssTreeWalker = function (_EventEmitter) {
    inherits(CssTreeWalker, _EventEmitter);

    function CssTreeWalker(code, plugins) {
        classCallCheck(this, CssTreeWalker);

        var _this = possibleConstructorReturn(this, (CssTreeWalker.__proto__ || Object.getPrototypeOf(CssTreeWalker)).call(this));

        _this.startingSource = code;
        _this.ast = null;
        plugins.forEach(function (plugin) {
            plugin.initialize(_this);
        });
        return _this;
    }

    createClass(CssTreeWalker, [{
        key: "beginReading",
        value: function beginReading() {
            this.ast = rework(this.startingSource).use(this.readPlugin.bind(this));
        }
    }, {
        key: "readPlugin",
        value: function readPlugin(tree) {
            this.readRules(tree.rules);
            this.removeEmptyRules(tree.rules);
        }
    }, {
        key: "readRules",
        value: function readRules(rules) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = rules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var rule = _step.value;

                    if (rule.type === RULE_TYPE) {
                        this.emit("readRule", rule.selectors, rule);
                    }
                    if (rule.type === MEDIA_TYPE) {
                        this.readRules(rule.rules);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "removeEmptyRules",
        value: function removeEmptyRules(rules) {
            var emptyRules = [];

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = rules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var rule = _step2.value;

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
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            emptyRules.forEach(function (emptyRule) {
                var index = rules.indexOf(emptyRule);
                rules.splice(index, 1);
            });
        }
    }, {
        key: "toString",
        value: function toString() {
            if (this.ast) {
                return this.ast.toString().replace(/,\n/g, ",");
            }
            return "";
        }
    }]);
    return CssTreeWalker;
}(EventEmitter);

var UglifyJS = require("uglify-js");
var fs$1 = require("fs");
var compressCode = function compressCode(code) {
    try {
        // Try to minimize the code as much as possible, removing noise.
        var ast = UglifyJS.parse(code);
        ast.figure_out_scope();
        var compressor = UglifyJS.Compressor({ warnings: false });
        ast = ast.transform(compressor);
        ast.figure_out_scope();
        ast.compute_char_frequency();
        ast.mangle_names({ toplevel: true });
        code = ast.print_to_string().toLowerCase();
    } catch (e) {
        // If compression fails, assume it's not a JS file and return the full code.
    }
    return code.toLowerCase();
};

var concatFiles = function concatFiles(files, options) {
    return files.reduce(function (total, file) {
        var code = "";
        try {
            code = fs$1.readFileSync(file, "utf8");
            code = options.compress ? compressCode(code) : code;
        } catch (e) {
            console.warn(e.message);
        }
        return "" + total + code + " ";
    }, "");
};

var getFilesFromPatternArray = function getFilesFromPatternArray(fileArray) {
    var sourceFiles = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = fileArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var string = _step.value;

            try {
                // See if string is a filepath, not a file pattern.
                fs$1.statSync(string);
                sourceFiles[string] = true;
            } catch (e) {
                var files = glob.sync(string);
                files.forEach(function (file) {
                    sourceFiles[file] = true;
                });
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return Object.keys(sourceFiles);
};

var filesToSource = function filesToSource(files, type) {
    var isContent = type === "content";
    var options = { compress: isContent };
    if (Array.isArray(files)) {
        files = getFilesFromPatternArray(files);
        return concatFiles(files, options);
    }
    // 'files' is already a source string.
    return isContent ? compressCode(files) : files;
};

var FileUtil = {
    concatFiles: concatFiles,
    filesToSource: filesToSource,
    getFilesFromPatternArray: getFilesFromPatternArray
};

var startTime = void 0;
var beginningLength = void 0;

var printInfo = function printInfo(endingLength) {
    var sizeReduction = ((beginningLength - endingLength) / beginningLength * 100).toFixed(1);
    console.log("\n    ________________________________________________\n    |\n    |   PurifyCSS has reduced the file size by ~ " + sizeReduction + "%  \n    |\n    ________________________________________________\n    ");
};

var printRejected = function printRejected(rejectedTwigs) {
    console.log("\n    ________________________________________________\n    |\n    |   PurifyCSS - Rejected selectors:  \n    |   " + rejectedTwigs.join("\n    |\t") + "\n    |\n    ________________________________________________\n    ");
};

var startLog = function startLog(cssLength) {
    startTime = new Date();
    beginningLength = cssLength;
};

var PrintUtil = {
    printInfo: printInfo,
    printRejected: printRejected,
    startLog: startLog
};

var addWord = function addWord(words, word) {
    if (word) words.push(word);
};

var getAllWordsInContent = function getAllWordsInContent(content) {
    var used = {
        // Always include html and body.
        html: true,
        body: true
    };
    var words = content.split(/[^a-z]/g);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = words[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var word = _step.value;

            used[word] = true;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return used;
};

var getAllWordsInSelector = function getAllWordsInSelector(selector) {
    // Remove attr selectors. "a[href...]"" will become "a".
    selector = selector.replace(/\[(.+?)\]/g, "").toLowerCase();
    // If complex attr selector (has a bracket in it) just leave
    // the selector in. ¯\_(ツ)_/¯
    if (selector.includes("[") || selector.includes("]")) {
        return [];
    }
    var skipNextWord = false,
        word = "",
        words = [];

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = selector[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var letter = _step2.value;

            if (skipNextWord && !/[ #.]/.test(letter)) continue;
            // If pseudoclass or universal selector, skip the next word
            if (/[:*]/.test(letter)) {
                addWord(words, word);
                word = "";
                skipNextWord = true;
                continue;
            }
            if (/[a-z]/.test(letter)) {
                word += letter;
            } else {
                addWord(words, word);
                word = "";
                skipNextWord = false;
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    addWord(words, word);
    return words;
};

var isWildcardWhitelistSelector = function isWildcardWhitelistSelector(selector) {
    return selector[0] === "*" && selector[selector.length - 1] === "*";
};

var hasWhitelistMatch = function hasWhitelistMatch(selector, whitelist) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = whitelist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var el = _step.value;

            if (selector.includes(el)) return true;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return false;
};

var SelectorFilter = function () {
    function SelectorFilter(contentWords, whitelist) {
        classCallCheck(this, SelectorFilter);

        this.contentWords = contentWords;
        this.rejectedSelectors = [];
        this.wildcardWhitelist = [];
        this.parseWhitelist(whitelist);
    }

    createClass(SelectorFilter, [{
        key: "initialize",
        value: function initialize(CssSyntaxTree) {
            CssSyntaxTree.on("readRule", this.parseRule.bind(this));
        }
    }, {
        key: "parseWhitelist",
        value: function parseWhitelist(whitelist) {
            var _this = this;

            whitelist.forEach(function (whitelistSelector) {
                whitelistSelector = whitelistSelector.toLowerCase();

                if (isWildcardWhitelistSelector(whitelistSelector)) {
                    // If '*button*' then push 'button' onto list.
                    _this.wildcardWhitelist.push(whitelistSelector.substr(1, whitelistSelector.length - 2));
                } else {
                    getAllWordsInSelector(whitelistSelector).forEach(function (word) {
                        _this.contentWords[word] = true;
                    });
                }
            });
        }
    }, {
        key: "parseRule",
        value: function parseRule(selectors, rule) {
            rule.selectors = this.filterSelectors(selectors);
        }
    }, {
        key: "filterSelectors",
        value: function filterSelectors(selectors) {
            var contentWords = this.contentWords,
                rejectedSelectors = this.rejectedSelectors,
                wildcardWhitelist = this.wildcardWhitelist,
                usedSelectors = [];

            selectors.forEach(function (selector) {
                if (hasWhitelistMatch(selector, wildcardWhitelist)) {
                    usedSelectors.push(selector);
                    return;
                }
                var words = getAllWordsInSelector(selector),
                    usedWords = words.filter(function (word) {
                    return contentWords[word];
                });

                if (usedWords.length === words.length) {
                    usedSelectors.push(selector);
                } else {
                    rejectedSelectors.push(selector);
                }
            });

            return usedSelectors;
        }
    }]);
    return SelectorFilter;
}();

var fs = require("fs");
var OPTIONS = {
    output: false,
    minify: false,
    info: false,
    rejected: false,
    whitelist: [],
    cleanCssOptions: {}
};

var getOptions = function getOptions() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var opt = {};
    for (var option in OPTIONS) {
        opt[option] = options[option] || OPTIONS[option];
    }
    return opt;
};

var minify = function minify(cssSource, options) {
    return new CleanCss(options).minify(cssSource).styles;
};

var purify = function purify(searchThrough, css, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = {};
    }
    options = getOptions(options);
    var cssString = FileUtil.filesToSource(css, "css"),
        content = FileUtil.filesToSource(searchThrough, "content");
    PrintUtil.startLog(minify(cssString).length);
    var wordsInContent = getAllWordsInContent(content),
        selectorFilter = new SelectorFilter(wordsInContent, options.whitelist),
        tree = new CssTreeWalker(cssString, [selectorFilter]);
    tree.beginReading();
    var source = tree.toString();

    source = options.minify ? minify(source, options.cleanCssOptions) : source;

    // Option info = true
    if (options.info) {
        if (options.minify) {
            PrintUtil.printInfo(source.length);
        } else {
            PrintUtil.printInfo(minify(source, options.cleanCssOptions).length);
        }
    }

    // Option rejected = true
    if (options.rejected && selectorFilter.rejectedSelectors.length) {
        PrintUtil.printRejected(selectorFilter.rejectedSelectors);
    }

    if (options.output) {
        fs.writeFile(options.output, source, function (err) {
            if (err) return err;
        });
    } else {
        return callback ? callback(source) : source;
    }
};

export default purify;
