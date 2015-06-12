# PurifyCSS

* Remove dead weight CSS not being used in your app.

Able to also detect **dynamically-loaded CSS classes**.

PurifyCSS has been designed from the beginning with **single-page apps** in mind.

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
```

``` javascript
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

### PurifyCSS works with all javascript frameworks.

# API
```javascript
var purify = require('purify-css');

purify(content, css, options, callback);
```

## ```content```
##### Type: ```Array``` or ```String```

**```Array```** of filepaths to the files you want purify to search through for used classes (HTML, Javascripts, Templates, anything that relates to CSS classes)

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

# At build time
[Grunt](https://github.com/purifycss/grunt-purify-css)

[Gulp](https://github.com/purifycss/gulp-purifycss)
