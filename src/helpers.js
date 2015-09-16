function extend(destObj) {
  for (var i = 1; i < arguments.length; i++) {
    var sourceObj = arguments[i];
    each(sourceObj, function(item, key) {
      destObj[key] = item;
    });
  }
  return destObj;
}

function map(collection, callback) {
  var mapped = [];
  each(collection, function(item) {
    mapped.push(callback(item));
  });
  return mapped;
}

function filter(collection, predicate) {
  var filtered = [];
  each(collection, function(item) {
    if (predicate(item)) {
      filtered.push(item);
    }
  });
  return filtered;
}

function flatten(mdArray, fltArray) {
  fltArray = fltArray || [];
  each(mdArray, function(item) {
    Array.isArray(item) ? flatten(item, fltArray) : fltArray.push(item);
  });
  return fltArray;
}

function uniq(dupeArray) {
  var deDupedHisto = {},
      deDupedResults = [];
  each(dupeArray, function(value) {
    deDupedHisto[value] = value;
  });
  each(deDupedHisto, function(item) {
    deDupedResults.push(item);
  });
  return deDupedResults;
}

function each(collection, iterator) {
  if (Array.isArray(collection)) {
    collection.forEach(function(item, i) {
      iterator(item, i, collection);
    });
  } else {
    for (var key in collection) {
      iterator(collection[key], key, collection);
    }
  }
}

function reduce(collection, iterator, accumulator) {
  var initd = arguments.length === 3;
  each(collection, function(value) {
    if (!initd) {
      accumulator = value;
      initd = true;
    } else {
      accumulator = iterator(accumulator, value);
    }
  });
  return accumulator;
}

function identity(value) {
  return value;
}

function every(collection, predicate) {
  predicate = predicate || identity(predicate);
  return !!reduce(collection, function(trueSoFar, value) {
    return trueSoFar && predicate(value);
  }, true);
}

var Helpers = {
  map: map,
  filter: filter,
  flatten: flatten,
  uniq: uniq,
  extend: extend,
  every: every,
  identity: identity,
  reduce: reduce,
  each: each
};

module.exports = Helpers;
