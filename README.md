# fumen
Chord and Rythm score rendering engine

## Required modules
* [Raphael](http://raphaeljs.com) >= 2.1.4
* [jQuery](http://jquery.org) >= 1.11.0

## Getting started
Following is the example to reneder a code for div element with id="canvas".
```javascript

// Initialize fumen on ready function
$(document).ready(function(){
	Fumen.Initialize();
});

// Make a parser object. 
var p = new Fumen.Parser();

// Parse fumen markdown texts
var track = p.parse(code);

// Maker a renderer object.
var renderer = new Fumen.Renderer($("#canvas"), {
					paper_width:793,
					paper_height:1122,
					ncol:1,
					nrow:1
               });

// Render it !
var task = renderer.render(track, false, null);
```

## Samples
* [index.html](index.html) might be a good sample of fumen !

## Sites
* [Fumen Github Pages](http://hbjpn.github.io/fumen/) - Manual page of fumen
* [fumen.click](http://fumen.click) - Fumen hosting site
