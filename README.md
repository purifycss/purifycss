# PurifyCSS

* Detects which CSS classes your app is using and creates a file without the unused CSS.

Able to also detect **dynamically-loaded CSS classes** in your javascript.

PurifyCSS has been designed from the beginning with **single-page apps** in mind.

*This is in addition to working with static page apps.*

# Potential reduction
* Bootstrap file: ~140k characters.
* Average Bootstrap usage: ~40% (at most)
* Minified Bootstrap: ~117k characters.
* Purified + Minified Bootstrap: **~27k characters**

# Install
```
npm install purify-css
```

#Able to detect
* Anytime your class name is intact in your code.

##### Example for the class ```button-active```
``` html
  <!-- html -->
  <!-- class directly on element -->
  <div class="button-active">click</div>
```

``` javascript
  // javascript
  // this example is jquery, but anytime your class name 
  // is together in your javascript, it will work
  $(button).addClass('button-active');
```

* Dynamically created classes

##### Example for the class ```button-active```
``` javascript
  // can detect even if class is split
  var half = 'button-';
  $(button).addClass(half + 'active');
  
  // can detect even if class is joined
  var dynamicClass = ['button', 'active'].join('-');
  $(button).addClass(dynamicClass);
```

* **All** javascript frameworks

##### Example for the class ```angular-button```
``` javascript
  <!-- angular template -->
  <div ng-class="'angular' + '-button'"></div>
```

##### Example for the class ```commentBox```
```javascript
  // react component
  var CommentBox = React.createClass({
    render: function() {
      return (
        <div className="commentBox">
          Hello, world! I am a CommentBox.
        </div>
      );
    }
  });
  React.render(
    <CommentBox />,
    document.getElementById('content')
  );
```

### PurifyCSS works with all Javascript frameworks.

# API
```javascript
var purify = require('purify-css');

purify(content, css, options, callback);
```

## ```content```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the files you want to search through for used classes (HTML, Javascripts, Templates, anything that relates to CSS classes)

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

## Command Line Tool

```
$ npm install -g purify-css
```

```
$ purifycss
usage: purifycss <css> <content> [option ...]

options:
 --min                Minify CSS
 --out [filepath]     Filepath to write purified css to
 --info               Logs info on how much css was removed

 -h, --help           Prints help (this message) and exits
```

# At build time
[Grunt](https://github.com/purifycss/grunt-purify-css)

