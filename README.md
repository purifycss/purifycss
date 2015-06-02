# PurifyCSS

* Remove dead weight CSS not being used in your app.

*Result:* smaller file sizes.

*Result:* reduced load time.

Able to detect **dynamically-loaded CSS classes** (classes that get initialized according to user interaction). PurifyCSS has been designed from the beginning with **single-page apps** in mind (works great for static sites too).

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
