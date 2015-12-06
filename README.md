# fumen
Chord and Rythm score rendering engine

## Required modules
* [Raphael](http://raphaeljs.com) >= 2.1.4
* [jQuery](http://jquery.org) >= 1.11.0

## Getting started
```javascript
// Make a parser object. 
var p = new Fumen.Parser();

/ Parse fumen markdown texts
var track = p.parse(code);

// Maker a renderer object.
var renderer = new Fumen.Renderer($("#canvas", paper_width, paper_height);

// Render it !
var task = renderer.render(track, false, null);
```

## Samples
* [index.html](index.html) might be a good sample of fumen !

## Sites
* [Fumen Github Pages](http://hbjpn.github.io/fumen/) - Manual page of fumen
* [fumen.click](http://fumen.click) - Fumen hosting site
