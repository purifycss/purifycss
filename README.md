# PurifyCSS

A tool that removes CSS that you aren't using in your app, which results in smaller file sizes, which ultimately reduces load time.

1. Check which classes you use in your HTML **and** Javascript.
2. Filter out your CSS file with only the classes that you **do** use.
3. ??
4. Profit

# Install
```
npm install purify-css
```

# API
```javascript
var purify = require('purify-css');

purify(content, css, options);
```

## ```content```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the files you want purify to search through for used classes (HTML, Javascripts, Templates, anything)

**```String```** of content you want us to look for used classes.


## ```css```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the css files you want us to filter.

**```String```** of css you want us to filter.


##```options```
##### Type: ```Object```

##### Properties of options object:

* **```minify:```** Set to ```true``` to minify. Default: ```false```

* **```output:```** Filepath to write purified css to. Returns raw string if ```false```. Default: ```false```

* **```info:```** Logs info on how much css was removed if ```true```. Default: ```false```
