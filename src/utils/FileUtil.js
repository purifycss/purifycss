var fs = require('fs');
var UglifyJS = require('uglifyjs');

var FileUtil = {
  compressCode: function (code) {
    try {
      // Try to minimize the code as much as possible, removing noise.
      var ast = UglifyJS.parse(code);
      ast.figure_out_scope();
      compressor = UglifyJS.Compressor({warnings: false});
      ast = ast.transform(compressor);
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names({toplevel: true});
      code = ast.print_to_string();
    } catch (e) {
      // If compression fails, assume it's not a JS file and return the full code.
    }

    return code;
  },

  concatFiles: function (files, options) {
    options = options || {};

    return files.reduce(function (total, file) {
      var code = fs.readFileSync(file, 'utf8');

      if (options.compress) {
        code = FileUtil.compressCode(code);
      }

      return total + code + ' ';
    }, '');
  }
};

module.exports = FileUtil;
