# Purify your CSS
### How?
1. Check the classes that you use in your HTML *and* Javascript.
2. Filter out your CSS file with only the classes that you **do** use.
3. Return a string of your purified CSS.

# How to use
```
npm install purify-css
```

# API
purify(content, css, options);

**content** (Array / String) filepaths that you use CSS in (html, javascripts)
**css** (Array / String) css that you want us to filter