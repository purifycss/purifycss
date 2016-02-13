var fs = require('fs');
var glob = require('glob');
var UglifyJS = require('uglifyjs');

var FileUtil = {
  compressCode: function (code) {
    try {
      // Try to minimize the code as much as possible, removing noise.
      var ast = UglifyJS.parse(code);
      ast.figure_out_scope();
      /* eslint-disable new-cap */
      var compressor = UglifyJS.Compressor({warnings: false});
      /* eslint-enable new-cap */
      ast = ast.transform(compressor);
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names({toplevel: true});
      code = ast.print_to_string();
    } catch (e) {
      // If compression fails, assume it's not a JS file and return the full code.
    }

    return code.toLowerCase();
  },

  concatFiles: function (files, options) {
    options = options || {};

    return files.reduce(function (total, file) {
      var code = fs.readFileSync(file, 'utf8').toLowerCase();

      if (options.compress) {
        code = FileUtil.compressCode(code);
      }

      return total + code + ' ';
    }, '');
  },

  getFilesFromPatternArray: function (patterns) {
    var sourceFiles = {};

    patterns.forEach(function (pattern) {
      var files = glob.sync(pattern);
      files.forEach(function (file) {
        sourceFiles[file] = true;
      });
    });

    return Object.keys(sourceFiles);
  },

  filesToSource: function (files, type) {
    var isContent = type === 'content';
    var options = {compress: isContent};

    if (Array.isArray(files)) {
      files = FileUtil.getFilesFromPatternArray(files);
      return FileUtil.concatFiles(files, options);
    }

    // 'files' is already a source string.
    if (isContent) {
      return FileUtil.compressCode(files);
    } else {
      return files.toLowerCase();
    }
  }
};

module.exports = FileUtil;
