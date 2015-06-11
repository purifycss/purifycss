# PurifyCSS

* Remove dead weight CSS not being used in your app.

Able to also detect **dynamically-loaded CSS classes**. PurifyCSS has been designed from the beginning with **single-page apps** in mind.

# Install
```
npm install purify-css
```

# API
```javascript
var purify = require('purify-css');

purify(content, css, options, callback);
```

## ```content```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the files you want purify to search through for used classes (HTML, Javascripts, Templates, anything)

**```String```** of content you want us to look for used classes.


## ```css```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the css files you want us to filter.

**```String```** of css you want us to filter.


##```options (optional)```
##### Type: ```Object```

##### Properties of options object:

* **```minify:```** Set to ```true``` to minify. Default: ```false```

* **```output:```** Filepath to write purified css to. Returns raw string if ```false```. Default: ```false```

* **```info:```** Logs info on how much css was removed if ```true```. Default: ```false```

##```callback (optional)```
##### Type: ```Function```

##### Example
``` javascript
purify(content, css, options, function(output){
  console.log(output, ' is the result of purify');
});
```

##### Example without options
``` javascript
purify(content, css, function(output){
  console.log('callback without options');
});
```
