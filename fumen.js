/*
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var Fumen = (function(){

/**
 * Chord rendering profile
 */
var CHORD_RENDER_THEME = {
"Default":{
	"_base_font_size" : 18,
	"_base_font_family" : "realbook_music_symbol",
	"_base_font_profile" :{
	},
	"_on_bass_font_size" : 18,
	"_on_bass_global_dy" : 0,
	"_on_bass_font_profile" :{
	},
	"_3rd_global_dy" : 2,
	"_3rd_font_profile" : {
		'M'   : function(p){return [[10,3,'M']];},
		'm'   : function(p){return [[10,3,'m']];}
	},
	"_6791113_global_dy" : 2,
	"_6791113_font_profile" : {
		'dim' : function(p){return [[11,2,"d"]];},
		'sus' : function(p){return [[ 8,3,"s"],[13,4,p?p:""]];},
		'M'   : function(p){return [[10,3,"M"],[13,4,p?p:""]];},
		'm'   : function(p){return [[10,3,"m"]];},
		'add' : function(p){return [[10,3,"a"],[13,4,p?p:""]];},
		'dig' : function(p){
				if(!p) p = "";
				else if(p=="11") p = "\x25";
				else if(p=="13") p = "\x26";
				return [[13,4,p]];
			}
	},
	"_5th_global_dy" : -8,
	"_5th_font_profile" : {
		'#'   : function(p){return [[13,0,'+'],[13,0,p]];},
		'b'   : function(p){return [[13,0,'-'],[13,0,p]];},
		'dig' : function(p){return [[13,0,p]];}
	},
	"_altered_global_dy" : -8,
	"_multi_altered_margin" : 0,
	"_altered_font_profile" : {
		'#'   : function(p){return [[13,0,'#'],[13,0,p]];},
		'b'   : function(p){return [[13,0,'b'],[13,0,p]];},
		'alt' : function(p){return [[13,0,'alt']];}
	}
},
"Arial":{
	"_base_font_size" : 20,
	"_base_font_family" : "Arial",
	"_base_font_profile" :{
		'#'   : function(p){return [[14,0,'#','smart_music_symbol']];},
		'b'   : function(p){return [[14,0,'b','smart_music_symbol']];},
	},
	"_on_bass_font_size" : 15,
	"_on_bass_global_dy" : 1,
	"_on_bass_font_profile" :{
		'#'   : function(p){return [[13,0,'#','smart_music_symbol']];},
		'b'   : function(p){return [[13,0,'b','smart_music_symbol']];},
	},
	"_3rd_global_dy" : 1,
	"_3rd_font_profile" : {
		'M'   : function(p){return [[16,0,'M']];},
		'm'   : function(p){return [[16,0,'m']];}
	},
	"_6791113_global_dy" : 1,
	"_6791113_font_profile" : {
		'dim' : function(p){return [[16,0,"dim"]];},
		'sus' : function(p){return [[16,0,"sus"],[15,1,p?p:""]];},
		'M'   : function(p){return [[16,0,"M"],[15,1,p?p:""]];},
		'm'   : function(p){return [[16,0,"m"]];},
		'add' : function(p){return [[16,0,"add"],[15,1,p?p:""]];},
		'dig' : function(p){
				if(!p) p = "";
				//else if(p=="11") p = "\x25";
				//else if(p=="13") p = "\x26";
				return [[15,1,p]];
			}
	},
	"_5th_global_dy" : -8,
	"_5th_font_profile" : {
		'#'   : function(p){return [[13,0,'+'],[13,0,p]];},
		'b'   : function(p){return [[13,0,'-'],[13,0,p]];},
		'dig' : function(p){return [[13,0,p]];}
	},
	"_altered_global_dy" : -8,
	"_multi_altered_margin" : -4,
	"_altered_font_profile" : {
		'#'   : function(p){return [[13,0,'#','smart_music_symbol'],[13,0,p]];},
		'b'   : function(p){return [[13,0,'b','smart_music_symbol'],[13,0,p]];},
		'alt' : function(p){return [[13,0,'alt']];}
	}
}
};

var RENDER_PARAM = {
	y_title_offset : 50,
	y_author_offset : 90,
	y_first_page_offset : 120,
	y_offset : 70,
	x_offset : 70,
	min_measure_width : 100,
	row_height : 24, // Basic height of the measure when no rs, mu and ml area is drawn
	row_margin : 10, // Margin between next y_base and lower edge of Measure Lower Area
	rs_area_height : 24, // Rhythm Slashes Area // ! Currently this should be same as row_height
	rm_area_height : 30, // Reharsal Mark Area
	mu_area_height : 20, // Measure Upper Area ( Repeat signs area )
	ml_row_height : 10, // Measure Lower Area ( Lyrics etc.. )
	below_mu_area_margin : 0, // Margin between MU and chord
	above_rs_area_margin : 5, // Margin between chord and rythm slash
	above_ml_area_margin : 8, // Margin between (chord/rythm slash) and measure lower(lyrics etc) rea
	header_body_margin : 10, // Margin between header and body (x-direction)
	max_scaling : 1.2,
	paper_width : 96 * 210 / 25.4, // 96dpi * A4_width[mm] / 25.4[mm/inche]
	paper_height : 96 * 297 / 25.4, // 96dpi * A4_height[mm] / 25.4[mm/inche]
	repeat_mark_font : {'font-family':'Times New Roman','font-style':'italic','font-weight':'bold'},
	reharsal_mark_font_size : 20,
};

var pages = new Array();

var RENDERING_RULE_BOUNDARY = new Array();

//
// Utility Functions
//

// SVG related
function svgLine(x0, y0, x1, y1)
{
	return ("M"+x0+","+y0+" L"+x1+","+y1);
}

// SVG related
function svgPath(point_array, close)
{
	var svg = "M";
	for(var i = 0; i < point_array.length; ++i){
		svg += (point_array[i][0]+","+point_array[i][1]);
		if(i < point_array.length-1)
			svg += " L";
	}
	if(close === true){
		svg += "Z";
	}
	return svg;
}

function svgArcBezie(point_array)
{
	// 4 points are required
	// Draw bround braces
	var svg = "M ";
	svg += ( point_array[0][0] + " " + point_array[0][1]);
	svg += " C";
	for(var i = 1; i < point_array.length; ++i)
		svg += (point_array[i][0] + " " + point_array[i][1] + " ");
	return svg;
}

// SVG and Raphael related
function raphaelText(paper, x, y, s, font_size, align, font_family)
{
	// align is 2-length string which specified alignment of the text
	// align = [l|c|r][t|c|b]
	var temp_text = paper.text(x,y,s).attr("font-size",font_size);
	if(font_family) temp_text.attr("font-family",font_family);
	var w = temp_text.getBBox().width;
	var h = temp_text.getBBox().height;
	if(align[0] == 'l' || align[0] == 'r')
		temp_text.attr("x",temp_text.attr("x") + w/2.0 * (align[0] == 'l' ? 1:-1));
	if(align[1] == 't' || align[1] == 'b')
		temp_text.attr("y",temp_text.attr("y") + h/2.0 * (align[1] == 't' ? 1:-1));
	return temp_text;
}

// SVG and Raphael related
function raphaelTextWithBox(paper, x, y, s, font_size)
{
	// align is 2-length string which specified alignment of the text
	// align = [l|c|r][t|c|b]
	var group = paper.set();
	var text = raphaelText(paper, x, y, s, font_size, "lt");
	var w = text.getBBox().width;
	var h = text.getBBox().height;
	var margin_y = h * 0.0;
	var margin_x = h * 0.1;

	var box = paper.rect(x, y, w + 2*margin_x, h + 2*margin_y);
	text.attr("x",text.attr("x") + margin_x);
	text.attr("y",text.attr("y") + margin_y);
	group.push(text, box);
	return group;
}

// Need raphael.export.js
function raphaelDownloadSvg(paper, filename)
{
	var svgString = paper.toSVG();
	var a = document.createElement('a');
	a.download = filename;
	a.type = 'image/svg+xml';
	//bb = new(window.BlobBuilder || WebKitBlobBuilder);
	//bb.append(svgString);
	//blob = bb.getBlob('image/svg+xml');
	var blob = new Blob([svgString], {type: 'image/svg+xml'});
	a.href = (window.URL || webkitURL).createObjectURL(blob);
	a.click();


	//var link = document.createElement('link');
	//link.rel = 'stylesheet';
	//link.href = window.URL.createObjectURL(blob);
	//document.body.appendChild(link);
}

// Formatting
function zeroPaddedInt(i, len)
{
	var s = String(i);
	if ( i < 0 ) return s;
	if ( s.length >= len ) return s;
	var n0 = len - s.length;
	for(var i = 0; i < n0; ++i) s = "0"+s;
	return s;
}

var inherits = function inherits(sub, sup) {
    var F = function F () {};
    F.prototype = sup.prototype;
    sub.prototype = new F();
    sub.prototype.constructor = sub;
};

function shallowcopy(obj)
{
	return jQuery.extend({}, obj);
}

function deepcopy(obj)
{
	return jQuery.extend(true, {}, obj);
}

//
// Task and Task queue class
//
var the_task_queue = new TaskQueue();

function TaskQueue()
{
	this.task_queue = {};
}

TaskQueue.prototype.enqueue = function(task)
{
	if(task.task_type !== null){
		// All the tasks with same task type are serialized
		// Tasks are queued
		if(! (task.task_type in this.task_queue) )
			this.task_queue[task.task_type] = [];
		this.task_queue[task.task_type].push(task);
		console.log("Enqueue task for queue '" + task.task_type + "'. Size = " + this.task_queue[task.task_type].length);
		if(this.task_queue[task.task_type].length == 1){
			setTimeout(task.run.bind(task), 0);
		}
	}else{
		setTimeout(task.run.bind(task),0); // Just run it immediately if task type is null
	}
};

TaskQueue.prototype.finish = function(task)
{
	// Finish notification from task
	if(task.task_type === null)
		return;

	if((!(task.task_type in this.task_queue)) ||
	   (this.task_queue[task.task_type].length == 0) ||
	   (this.task_queue[task.task_type][0] != task)){
		alert("Invalid task execution state detected");
	}else{
		var q = this.task_queue[task.task_type];
		q.shift();
		console.log("Dequeue task for queue '" + task.task_type + "'. Size = " + q.length);
		if(q.length > 0){
			// TODO : Set timer for next task run ?
			q[0].run();
		}
	}
};

/**
 *
 * @param call_back Callback function called when task is finished with context.
 * @param interval Interval of call worker function in msec.
 * @param task_type Task type. Any value can be specified. All the tasks which has the same task type(other than null)
 *                  will be serialized.
 * @param context Argument to worker function.
 * @param worker Worker function. worker function is called with context.
 *               Worker function can return followings
 *               Task : Returned new task is executed asynchronously
 *               Promise :
 *               Other : Returned value is handled to the callback function specified as a parameter of Task.then().
 *
 * @param queue Optional queue to use. If queue is not specified or null, global queue is used.
 * @todo How to make child task in worker function ??
 */
function Task(context, worker, task_type, queue)
{
	if(task_type === undefined)
		task_type = null;

	this.task_type = task_type;
	this.context = context;
	this.worker = worker;

	this.promise = null;
	this.resolve = null;
	this.reject  = null;


	var me = this;
	// TODO : Promise.defer may be better, but chrome does not support it yet.
	this.promise = new Promise(function(resolve, reject){
		me.resolve = resolve;
		me.reject = reject;
	});

	queue = queue === undefined ? null : queue;
	this.queue = (queue ? queue : the_task_queue);
	this.queue.enqueue(this);
}


Task.prototype.then = function(func){
	return this.promise.then(func);
};


Task.prototype.run = function(){

	var ret = this.worker(this.context);

	if( (ret instanceof Task) || (ret instanceof Promise)){
		// Asynchronous execution of worker
		var me = this;
		ret.then(function(taskret){
			// End of task
			// false, 0, true, ... all the values other than Task and undefined is land in here.
			// ret is treated as a parameter for resolve
			if(me.resolve === null){ alert("Invalid state detected"); }
			me.resolve(taskret);
			// Note that resolve will invoke then "later".
			// finish notification will invoke a next task.
			// It is required to wait a 1msec to keep order of the "then" and next task call.
			setTimeout(me.queue.finish.bind(me.queue, me), 1);
		});
	}else{
		// End of task
		// false, 0, true, ... all the values other than Task and undefined is land in here.
		// ret is treated as a parameter for resolve
		if(this.resolve === null){ alert("Invalid state detected"); }
		this.resolve(ret);
		// Note that resolve will invoke then "later".
		// finish notification will invoke a next task.
		// It is required to wait a 1msec to keep order of the "then" and next task call.
		setTimeout(this.queue.finish.bind(this.queue, this), 1);
	}
};

/**
 * Enqueue function call.
 * @param func  Function to call
 * @param arguments Arguments to func as array. arguments are applied to func with "apply" function.
 * @param task_type Queue indentifer
 * @returns {Task}
 */
Task.enqueueFunctionCall = function(func, arguments, task_type)
{
	return new Task({func:func, arguments:arguments, i:0, func_ret:undefined}, function(ctx){
		if(ctx.i > 0)
			return true; // Waste function's result : TODO : Handle function result to then
		ret = ctx.func.apply(null, ctx.arguments);
		ctx.func_ret = ret;
		if(ret===undefined) ret = true; // Force to exit 1 time even if the function returns undefined.
		++ctx.i;
		return ret;
	}, task_type); // Make one shot task
};

Task._ForeachWorker = function(wc)
{
	// Temporal queue to serialize following 2 tasks
	var tempqueue = new TaskQueue();
	new Task(wc, function(wc2){
		return wc2.worker(wc2.loopindex, wc2.looptarget.length, wc2.looptarget[wc2.loopindex],wc2.context);
	}, 0, tempqueue);
	var task = new Task(wc, function(wc2){
		if(wc2.loopindex == wc2.looptarget.length - 1){ return wc2.context; }
		var newwc = shallowcopy(wc2);
		newwc.loopindex++;
		return new Task(newwc, Task._ForeachWorker, null);
	}, 0, tempqueue);
	return task;
};

Task.Foreach = function(looptarget, worker, context, task_type)
{
	var wcontext = {};
	wcontext.worker = worker;
	wcontext.context = context;
	wcontext.looptarget = looptarget;
	wcontext.loopindex = 0;
	var task = new Task(wcontext, Task._ForeachWorker, task_type);

	return task;
};

//
// Parser
//

var WHOLE_NOTE_LENGTH = 2*3*5*7*9*11*13*64;

function Track()
{
	this.reharsal_groups = new Array();
	this.macros = {};
	this.pre_render_info = {};
}

function ReharsalGroup()
{
	this.name = null;
//	this.measures = new Array();
	this.blocks = new Array(); // Blocks in the reharsal groups
	this.macros = {};
}

function Measure()
{
	this.elements = new Array();
	this.boundary_info = ['n','n'];
	// "n" : normal boundary
	// "b" : loop Begin boundary
	// "e" : loop End boundary
	// "d" : Double line boundary

	this.header_width = 0;
	this.body_width = 0;
	this.footer_width = 0;

	this.body_scaling = 1.0;
	this.new_line = false;

	this.renderprop = {}; // Rendering information storage
}

function Rest(length_s)
{
	this.length_s = length_s;
	this.lengthIndicator = parseLengthIndicator(length_s);
	this.length = this.lengthIndicator.length;
	this.renderprop = {};
}


var cnrg = new RegExp();
cnrg.compile(/^((sus4?)|(add(9|13))|(alt)|(dim)|(7|9|6|11|13)|((\+|\#)(5|9|13|11))|((\-|b)(5|9|13))|([Mm]([Aa][Jj]?|[Ii][Nn]?)?)|([\,\(\)]))/);
var CS_IDX_OFFSET=2;

var CS_SUS=0;
var CS_ADD=1;
var CS_ADD_DIG=2;
var CS_ALT=3;
var CS_DIM=4;
var CS_DIG=5;
var CS_PLS=6;
var CS_PLS_SYM=7;
var CS_PLS_DIG=8;
var CS_MNS=9;
var CS_MNS_SYM=10;
var CS_MNS_DIG=11;
var CS_M  =12;
var CS_M_TAIL=13;
var CS_SEP=14;
var NUM_CS=15;
var CS_LIST = [CS_M, CS_DIG, CS_SUS, CS_DIM, CS_SEP, CS_PLS, CS_MNS, CS_ADD, CS_ALT]; // Frequently used first

function parseChordMids(s)
{
	var holder = [];
	var objholder = [];
	while(s.length > 0){
		//if([",","(",")"].indexOf(s[0]) >= 0){ s = s.substr(1); continue; }
		m = s.match(cnrg);
		//console.log(m);
		if(m === null){
			console.log("Invalid code notation : " + s);
			return null;
		}
		for(var i = 0; i < CS_LIST.length; ++i){
			if(m[CS_IDX_OFFSET+CS_LIST[i]] !== undefined && m[CS_IDX_OFFSET+CS_LIST[i]] !== null){

				holder.push({cs:CS_LIST[i],s:m[0],g:m});
				break;
			}
		}

		s = s.substr(m[0].length);
	}

	var minor_exists = false;
	for(var i = 0; i < holder.length; ++i){
		switch(holder[i].cs){
		case CS_M:
			var s = holder[i].s;
			var isMaj = (s == "M" || s.toLowerCase() == "maj" || s.toLowerCase() == "ma");
			if(isMaj == false) minor_exists = true;

			if(minor_exists && isMaj == true){
				// mM7 Chord is expected
				if(holder[i+1].cs == CS_DIG){
					objholder.push({type:'M',param:holder[i+1].s});
					++i; // Skip next CS_DIG
				}else{
				}
			}else if(isMaj){
				objholder.push({type:'M'});
			}else{
				objholder.push({type:'m'});
			}
			break;
		case CS_DIG:
			objholder.push({type:'dig',param:holder[i].s});
			break;
		case CS_SUS: objholder.push({type:'sus', param:holder[i].s.substr(3)});	break;
		case CS_DIM: objholder.push({type:'dim'}); break;
		case CS_MNS: objholder.push({type:'b', param:holder[i].s.substr(1)});	break;
		case CS_PLS: objholder.push({type:'#', param:holder[i].s.substr(1)});	break;
		case CS_ADD: objholder.push({type:'add', param:holder[i].s.substr(3)});  break;
		case CS_ALT: objholder.push({type:'alt'}); break;
		}
	}
	//console.log(objholder);

	return [holder, objholder];
};

function getNoteProfile(note_str)
{
	var IDX={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11};
	var m = note_str.match(/([A-G])(#|b)?(\d+)/);
	if(!m) return null;
	var code = parseInt(m[3])*12 + IDX[m[1]] + (m[2]=='#'?1:-1) - 36 + 0x3C; // C3 bocomes 0x3C
	return {code:code, note:[m[1],m[2],m[3]]};
}

// Parse strings of number + dot
function parseLengthIndicator(length_s)
{
	var mm = length_s.match(/(\d+)((_(3|5|6|7))|(\.+))?(\~)?/);
	if(!mm) return null;

	var base = parseInt(mm[1]);
	var length = 0;
	if(mm[3]){
		// Renpu
		var renpu = parseInt(mm[4]);
		length = WHOLE_NOTE_LENGTH / (base/2) / renpu;
	}else{
		length = WHOLE_NOTE_LENGTH / base;
		var tp = length;
		var numdot = mm[5] ? mm[5].length : 0;
		for(var j = 0; j < numdot; ++j){
			tp /= 2;
			length += tp;
		}
	}
	return {length:length,base:base,renpu:renpu,numdot:numdot,has_tie:mm[6]?true:false};
}

function parseChordNotes(str)
{
	str = str.substr(1); // first (

	var parseNoteGroup = function(sng){
		var sngi = 0;
		sng = sng.substr(1); // first (
		var tmp = "";
		while(sng[sngi] != ")"){
			tmp += sng[sngi];
			++sngi;
		}
		var notes_str = tmp.split(",");
		var nr = [];
		for(var nsi=0; nsi < notes_str.length; ++nsi){
			//var m = notes_str[nsi].match(/([A-G])(#|b)?(\d+)/);
			var np = getNoteProfile(notes_str[nsi]);
			if(!np)
				throw "INVALID_TOKEN_DETECTED : invalid note notation"
			nr.push(np);
		}

		sng = sng.substr(sngi+1); // Skip )
		var r = /\:(([\d_]+)(\.*)(\~)?)/;
		var m = sng.match(r);

		if(!m[0])
			throw "INVALID_TOKEN_DETECTED";

		var li = parseLengthIndicator(m[1]);

		return {s:sng.substr(m[0].length),ng:{nr:nr,lengthIndicator:li}};
	};

	var nglist = [];
	while(true){
		var ret = parseNoteGroup(str);
		nglist.push(ret.ng);
		var str = ret.s;
		if(str[0] == ","){
			str = str.substr(1);
		}else if(str[0] == ")"){
			break;
		}else{
			throw "INVALID_TOKEN_DETECTED";
		}
	}
	return nglist;
}

function Chord(chord_str)
{
	this.chord_str = chord_str;

	this.is_valid_chord = true;

	/*this.length = WHOLE_NOTE_LENGTH;
	this.length_s = null;
	this.tie = false;
	*/

	this.renderprop = {};

	this.exceptinal_comment = null;
	this.lyric = null;

	this.lengthIndicator = null;

	this.nglist = null;

	// Analyze Chord symbol
	var r = /^(((A|B|C|D|E|F|G)(#|b)?([^\/\:]*))?(\/(A|B|C|D|E|F|G)(#|b)?)?)(:((([\d_]+)(\.*)(\~)?)|(\(.*\))))?/;
	var m = chord_str.match(r);
	//console.log(m);
	// [0] is entire matched string
	if( m && m[0] != ""){
		this.chord_name_str = m[1];
		this.note_base = m[3];
		this.sharp_flat = m[4];
		this.mid_str = m[5];
		this.base_note_base = m[7];
		this.base_sharp_flat = m[8];

		this.mid_elems = null;
		if(this.mid_str !== undefined){
			var ret = parseChordMids(this.mid_str);
			if(ret !== null){
				this.mid_elems = ret[0];
				this.mid_elem_objs = ret[1];
			}
			this.is_valid_chord = (ret !== null);
		}
		if(m[9]){

			if(m[11]){
				var li = parseLengthIndicator(m[11]);
				//this.length_s = m[11];
				//this.length = li.length;
				this.lengthIndicator = li;
				//this.tie = li.has_tie;
			}else if(m[15]){
				// Notes
				this.nglist = parseChordNotes(m[15]);
				console.log(this.nglist);
			}
		}

		//this.tie = (m[14] == '~');
	}else{
		this.chord_name_str = this.chord_str;
		this.is_valid_chord = false;
	}
}

Chord.prototype.setException = function(exceptional_comment)
{
	this.exceptinal_comment = exceptional_comment;
}

Chord.prototype.setLyric = function(lyric)
{
	this.lyric = lyric;
}


Chord.getTranpsoedNote = function(transpose, half_type, note_base, sharp_flat)
{
	var seq = [ ["A"],["A#","Bb"],["B","Cb"],["C"],["C#","Db"],["D"],["D#","Eb"],["E","Fb"],["F"],["F#","Gb"],["G"],["G#","Ab"] ];
	var note = note_base;
	if(sharp_flat !== undefined)
		note += sharp_flat;

	if(transpose == 0) return note;

	var i = 0;
	for(i = 0; i < seq.length; ++i){
		if(seq[i].indexOf(note) >= 0)
			break;
	}

	var k = i + transpose;
	while( k < 0 ) k += 12;

	var s = seq[k%12];
	if(s.length == 1){
		return s[0];
	}else{
		switch(half_type){
		case "GUESS":
			// TODO : More intelligent transposing based on key of the track.
			if(sharp_flat){
				if(sharp_flat == "#") return s[0];
				else return s[1];
			}else{
				return s[1]; // Sharp based
			}
			break;
		case "SHARP":
			return s[0];
			break;
		case "FLAT":
			return s[1];
			break;
		}
	}
	return null;
};

Chord.prototype.getChordStrBase = function(tranpose, half_type)
{
	if(!this.is_valid_chord)
		return [false,this.chord_str]; // Not chord or invalid chord notation

	var tranposed_note = null;
	if(this.note_base !== undefined)
		tranposed_note = Chord.getTranpsoedNote(tranpose, half_type, this.note_base, this.sharp_flat);
	var transposed_base_note = null;
	if(this.base_note_base !== undefined){
		transposed_base_note = Chord.getTranpsoedNote(tranpose, half_type, this.base_note_base, this.base_sharp_flat);
	}

	return [tranposed_note, transposed_base_note];
};

function LoopIndicator(indicators)
{
	// Note : Content of indicators are not always integers.
	// intindicators is storage for integer indicators analyzed from indicators.
	this.indicators = indicators;
	this.intindicators = [];
	var intrg = new RegExp(/(\d+)/);
	for(var i = 0; i < this.indicators.length; ++i){
		m = this.indicators[i].match(intrg);
		if(m){
			this.intindicators.push(parseInt(m[0]));
		}
	}
}

function LongRestIndicator(longrestlen)
{
	this.longrestlen = longrestlen;
}

function Time(numer, denom)
{
	this.numer = numer;
	this.denom = denom;
}

function MeasureBoundary()
{
}

function MeasureBoundaryMark(nline)
{
	this.nline = nline;
}

function LoopBeginMark()
{
}

function LoopEndMark(param)
{
	this.times = param.times;
	this.ntimes = param.ntimes;
}

function LoopBothMark(param)
{
	this.times = param.times;
	this.ntimes = param.ntimes;
}

function MeasureBoundaryFinMark()
{
}

var inherits = function inherits(sub, sup) {
    var F = function F () {};
    F.prototype = sup.prototype;
    sub.prototype = new F();
    sub.prototype.constructor = sub;
};

inherits(MeasureBoundaryMark, MeasureBoundary);
inherits(LoopBeginMark, MeasureBoundary);
inherits(LoopEndMark, MeasureBoundary);
inherits(LoopBothMark, MeasureBoundary);
inherits(MeasureBoundaryFinMark, MeasureBoundary);

// Signs
function DaCapo()
{
}

DaCapo.prototype.toString = function(){
	return "D.C.";
};

function DalSegno(number, al)
{
	this.number = number;
	this.al = al; // Either Coda/Fine
}

DalSegno.prototype.toString = function(){
	var dss="D.S."+(this.number===null?"":this.number);
	var als=this.al===null?"":(" al "+this.al.toString());
	return dss+als;
};

function Segno(number, opt)
{
	this.number = number;
	this.opt = opt;
}

function Coda(number)
{
	this.number = number;
}

Coda.prototype.toString = function(){
	return "Coda"+(this.number===null?"":this.number);
};

function ToCoda(number)
{
	this.number = number;
}

function Fine()
{
}

Fine.prototype.toString = function(){
	return "Fine";
};

function Comment(comment, chorddep)
{
	this.comment = comment;
	this.chorddep = chorddep; // Dependency for particular chord : true/false
}

function Lyric(lyric, chorddep)
{
	this.lyric = lyric;
	this.chorddep = chorddep; // Dependency for particular chord : true/false
}

function Parser(error_msg_callback)
{
	this.context = {line:0, char:0};
	this.error_msg_callback = error_msg_callback;
}

function charIsIn(c, chars)
{
	for(var i = 0; i < chars.length; ++i)
		if(chars[i] == c)
			return {r:true, index:i};
	return null;
}

function charStartsWithAmong(s, strlist)
{
	for(var i = 0; i < strlist.length; ++i)
		if(s.indexOf(strlist[i]) == 0)
			return {index:i, s:strlist[i]};
	return null;
}



var TOKEN_INVALID = -1;
var TOKEN_END = 0;
var TOKEN_WORD = 1;
var TOKEN_ASIS = 2;
var TOKEN_BRACKET_LR = 3; // Left round
var TOKEN_BRACKET_RR = 4; // Right round
var TOKEN_BRACKET_LS = 5; // Left square
var TOKEN_BRACKET_RS = 6; // Right square
var TOKEN_BRACKET_LA = 7; // Left angle
var TOKEN_BRACKET_RA = 8; // Right angle
var TOKEN_BRACKET_LW = 9; // Left wave {
var TOKEN_BRACKET_RW = 10; // Right wave }
var TOKEN_MB = 14;             // "|"
var TOKEN_MB_DBL = 15;         // "||"
var TOKEN_MB_LOOP_BEGIN = 16;  // "||:"
var TOKEN_MB_LOOP_END = 17;    // ":||"
var TOKEN_MB_LOOP_BOTH = 18;   // ":||:"
var TOKEN_MB_FIN = 19;         // "||."
var TOKEN_COMMA = 20;
var TOKEN_SLASH =  21; // "\/"
var TOKEN_NL = 22; // \n"
var TOKEN_PERCENT = 23;
var TOKEN_EQUAL = 24;
var TOKEN_STRING = 25;    // String with double quote
var TOKEN_STRING_SQ = 26; // String with single quote
var TOKEN_STRING_GRAVE_ACCENT = 27; // String with grave accent '
var TOKEN_ATMARK = 30; // @
var TOKEN_COLON = 31; // :

var WORD_DEFINIITON_GENERAL = /^(\w[\w\.\,\-\+\#\:]*)/;
var WORD_DEFINITION_IN_REHARSAL_MARK = /^[^\[\]]*/;
var WORD_DEFINITION_CHORD_SYMBOL = /^[\w\.\,\-\+\#\/\(\)\:\~]*/;

Parser.prototype.onParseError = function(msg)
{
	var errormsg = "Parse error on Line " + this.context.line + " : " + msg;
	console.log(errormsg);
	console.trace();
	if(this.error_msg_callback){
		this.error_msg_callback(errormsg);
	}else{
		alert(errormsg);
	}
	throw "Parse error";
};

Parser.prototype.nextToken = function(s, dont_skip_spaces)
{
	word_def = WORD_DEFINIITON_GENERAL;

	var skipped_spaces = 0;
	if(!(dont_skip_spaces === true)){
		while(s.length > 0 && charIsIn(s[0], ' 	')){
			s = s.substr(1);
			++skipped_spaces;
		}
	}

	if(s.length == 0) return {token:null, s:s, type:TOKEN_END, ss:skipped_spaces};

	// At first, plain string is analyzed irrespective of word_def.
	if(s[0] == '"' || s[0] == "'" || s[0] == "`")
	{
		var quote = s[0];
		var plain_str = "";
		s = s.substr(1);
		while( s.length > 0 && s[0] != quote){
			plain_str += s[0];
			s = s.substr(1);
		}
		var strclosed = (s.length > 0 && s[0] == quote);
		if(!strclosed) this.onParseError("ERROR_WHILE_PARSING_PLAIN_STRING");
		s = s.substr(1);

		return {token:plain_str, s:s, type:(quote == '"' ? TOKEN_STRING : (quote == "'" ? TOKEN_STRING_SQ : TOKEN_STRING_GRAVE_ACCENT)), ss:skipped_spaces};
	}

	var r = charStartsWithAmong(s, ["||:","||.","||","|"]);
	if(r != null){
		return {token:r.s, s:s.substr(r.s.length), ss:skipped_spaces,
			type: [
				TOKEN_MB_LOOP_BEGIN, TOKEN_MB_FIN, TOKEN_MB_DBL, TOKEN_MB][r.index]
		};
	}

	var m = null;
	m = s.match(/^(\:\|\|\:?)(x(\d+|X))?/); // ":||" or ":||:". Repeat number can be specified as "x<digit|n>"
	if (m != null)
	{
		var loopTimes = 2;
		var isNTimes=false;
		if(m[2]!=null){
			if(m[3]=="X") isNTimes = true;
			else loopTimes = Number(m[3]);
		}
		return {token:m[0],s:s.substr(m[0].length), ss:skipped_spaces, type:(m[1]==":||:" ? TOKEN_MB_LOOP_BOTH : TOKEN_MB_LOOP_END),param:{times:loopTimes,ntimes:isNTimes}};
	}

	var r = charIsIn(s[0], '[]<>(){},\n\/%=@:');
	if(r != null){
		return {token: s[0], s: s.substr(1), ss:skipped_spaces,
			type: [
				TOKEN_BRACKET_LS, TOKEN_BRACKET_RS,
				TOKEN_BRACKET_LA, TOKEN_BRACKET_RA,
				TOKEN_BRACKET_LR, TOKEN_BRACKET_RR,
				TOKEN_BRACKET_LW, TOKEN_BRACKET_RW,
				TOKEN_COMMA, TOKEN_NL, TOKEN_SLASH,
				TOKEN_PERCENT, TOKEN_EQUAL, TOKEN_ATMARK, TOKEN_COLON][r.index]
		};
	}

	// "Word characters"
	m = s.match(word_def);
	if (m != null)
	{
		//console.log(m);
		var w = m[0];
		return {token:w, s:s.substr(w.length), type:TOKEN_WORD, ss:skipped_spaces};
	}

	throw "INVALID_TOKEN_DETECTED";
	return {token:null, s:null, type:TOKEN_INVALID, ss:skipped_spaces};
};

Parser.prototype.parseGroup = function(profile, s, errmsg)
{
	var org_s = s;
	var tokens = new Array();
	for(var i = 0; i < profile.length; ++i){
		var ns = profile[i][1];
		var expected_token_type = profile[i][0];
		var l = new Array();
		var loop_flg = true;
		while(loop_flg){
			var r = this.nextToken(s);
			switch(ns){
			case "":
				if(r.type != expected_token_type) this.onParseError(errmsg);
				l.push(r.token);
				s = r.s;
				loop_flg = false;
				break;
			case "*":
				if(r.type != expected_token_type){ loop_flg = false; break; }
				l.push(r.token);
				s = r.s;
				break;
			case "+":
				if(r.type != expected_token_type){
					if(l.length == 0) this.onParseError(errmsg);
					else { loop_flag = false; break; }
				}
				l.push(r.token);
				s = r.s;
				break;
			case "?":
				if(r.type != expected_token_type) break;
				l.push(r.token);
				s = r.s;
				break;
			default:
				throw "ASSERTION ERROR";
			}
		}
		tokens.push(l);
	}

	return {tokens: tokens, s:s};
};

Parser.prototype.parseReharsalMark = function(trig_token, s)
{
	// "Word characters"
	m = s.match(WORD_DEFINITION_IN_REHARSAL_MARK);
	if (m != null)
	{
		reharsalMarkName = m[0];
		var r = this.nextToken(s.substr(m[0].length));
		if(r.type == TOKEN_BRACKET_RS)
			return {reharsalMarkName: reharsalMarkName, s:r.s};
	}
	throw "Invalid reharsal mark";
};

Parser.prototype.parseLoopIndicator = function(trig_token_type, s)
{
	// prerequisite
	//   trig_token_type = TOKEN_BRACKET_LS
	var loop_flg = true;
	var indicators = new Array();
	while(loop_flg){
		var r = this.nextToken(s);
		if(r.type != TOKEN_WORD) this.onParseError("ERROR_WHILE_PARSE_LOOP_INDICATOR");
		indicators.push(r.token);
		s = r.s;
		r = this.nextToken(s);
		s = r.s;
		if(r.type == TOKEN_BRACKET_RS) break;
		else if(r.type != TOKEN_COMMA) this.onParseError("ERROR_WHILE_PARSE_LOOP_INDICATOR");
	}

	return {loopIndicator: new LoopIndicator(indicators), s:s};
};

Parser.prototype.parseLongRestIndicator = function(trig_token_type, s)
{
	// prerequisite
	//   trig_token_type = TOKEN_BRACKET_LW

	var r = this.nextToken(s);
	s = r.s;

	if(r.type != TOKEN_WORD) this.onParseError("ERROR_WHILE_PARSE_OMIT_INDICATOR");

	longrestlen = r.token;

	r = this.nextToken(s);
	s = r.s;

	if(r.type != TOKEN_BRACKET_RW) this.onParseError("ERROR_WHILE_PARSE_OMIT_INDICATOR");

	return {longRestIndicator: new LongRestIndicator(longrestlen), s:s};
};

Parser.prototype.parseTime = function(trig_token_type, s)
{
	// prerequisite
	//   trig_token_type = TOKEN_BRACKET_LR
	var numer = 0;
	var denom = 0;

	var r = this.nextToken(s);
	s = r.s;
	if(r.type != TOKEN_WORD) this.onParseError("ERROR_WHILE_PARSE_TIME");
	numer = r.token;

	r = this.nextToken(s);
	s = r.s;
	if(r.type != TOKEN_SLASH) this.onParseError("ERROR_WHILE_PARSE_TIME");

	r = this.nextToken(s);
	s = r.s;
	if(r.type != TOKEN_WORD) this.onParseError("ERROR_WHILE_PARSE_TIME");
	denom = r.token;

	r = this.nextToken(s);
	s = r.s;
	if(r.type != TOKEN_BRACKET_RR) this.onParseError("ERROR_WHILE_PARSE_TIME");

	return {time: new Time(numer, denom), s:s};
};

Parser.prototype.parseSign = function(trig_token_type, s)
{
	// Read until ">" found
	var index = s.indexOf(">");
	if(index < 0) throw "Parse error on Sign(0)";

	var signStr = s.slice(0, index);
	s = s.slice(index+1); // ">" is skipped

	// Parse sign string
	// "D.S.([0-9]+)?( al Coda([0-9]+)?)
	var r = this.nextToken(signStr, WORD_DEFINIITON_GENERAL);
	if(r.type != TOKEN_WORD) throw "Parse error on Sign(1)";
	regDS = /D\.S\.([0-9]+)?/;
	regCoda = /Coda([0-9]+)?/;
	regSegno = /S(egno)?([0-9]+)?$/;
	var m = null;
	if(r.token == "Fine"){
		sign = new Fine();
	}else if(r.token == "D.C."){
		sign = new DaCapo();
	}else if((m = r.token.match(regCoda)) !== null){
		sign = new Coda(m[1] === undefined ? null : m[1]);
	}else if((m = r.token.match(regSegno)) !== null){
		var m2 = r.s.match(/^\s*(straight|((with\s+)repeat))/);
		console.log(r.s + "/" + signStr + m2);
		sign = new Segno(m[2] === undefined ? null : m[2], m2 ? m2[1] : null);
	}else if(r.token == "to"){
		r = this.nextToken(r.s, WORD_DEFINIITON_GENERAL);
		if(r.type != TOKEN_WORD) throw "Invalid token after to.";
		m = r.token.match(regCoda);
		if(m === null) throw "Coda was not detected";
		sign = new ToCoda(m[1] === undefined ? null : m[1]);
	}else if( (m = r.token.match(regDS)) !== null){
		var dsNumber = m[1] === undefined ? null : m[1];
		var al = null;
		r = this.nextToken(r.s, WORD_DEFINIITON_GENERAL);
		if(r.type == TOKEN_END){
		}else{
			if(r.type != TOKEN_WORD) throw "Invalid token after D.S.(1)";
			if(r.token != "al") throw "Invalid token after D.S.(2)";
			r = this.nextToken(r.s, WORD_DEFINIITON_GENERAL);
			if(r.type != TOKEN_WORD) throw "Invalid token after al";
			if(r.token == "Fine") al = new Fine();
			else if( (m = r.token.match(regCoda)) !== null ) al = new Coda(m[1] === undefined ? null : m[1]);
			else throw "Invalid token after al(2)";
		}
		sign = new DalSegno(dsNumber, al);
	}else{
		throw "Invalid token in parse sign";
	}

	return {sign: sign, s:s};
};

Parser.prototype.parseChordSymbol = function(trig_token, trig_token_type, s)
{
	// prerequisite:
	//   trig_token_type == TOKEN_WORD || TOKEN_SLASH
	// Parsing rule:
	//      Any continuous string of WORD_DEFINITION_GENERAL | "(" | ")"  | "/"
	//      without any spaces are read as chord symbol.
	//      Validtion of chord symbol notation is sperately conducted by
	//      Chord class.

	chord_symbol = trig_token;
	var m = s.match(WORD_DEFINITION_CHORD_SYMBOL);
	if(m){
		chord_symbol += m[0];
		s = s.substr(m[0].length);
	}
	var chord = new Chord(chord_symbol);
	return {s:s, chord:chord};
};

Parser.prototype.parseRest = function(trig_token, trig_token_type, s)
{
	// Analyze Rest symbol
	var r = /^r\:(([\d_]+)(\.*))$/;
	var m = trig_token.match(r);
	var rest = null;
	if(m) rest = new Rest(m[1]);
	return {s:s, rest:rest};
};

Parser.prototype.parseMeasure = function(trig_token_obj, s)
{
	// prerequisite:
	//   trig_boundary == TOKEN_MB || TOKEN_MB_DBL || TOKEN_MB_LOOP_BEGIN
	// note:
	//   | or || or ||: or :|| at the end of the measure will "not" be consumed.
	var measure = new Measure();

	if(trig_token_obj.type == TOKEN_MB)
		measure.elements.push(new MeasureBoundaryMark(1));
	else if(trig_token_obj.type == TOKEN_MB_DBL)
		measure.elements.push(new MeasureBoundaryMark(2));
	else if(trig_token_obj.type == TOKEN_MB_LOOP_END)
		measure.elements.push(new LoopEndMark(trig_token_obj.param));
	else if(trig_token_obj.type == TOKEN_MB_LOOP_BEGIN)
		measure.elements.push(new LoopBeginMark());
	else if(trig_token_obj.type == TOKEN_MB_LOOP_BOTH)
		measure.elements.push(new LoopBothMark(trig_token_obj.param));
	else if(trig_token_obj.type == TOKEN_MB_FIN)
		measure.elements.push(new MeasureBoundaryFinMark());

	var loop_flg = true;
	var atmark_detected = false;
	var associated_chord = null;
	while(loop_flg){
		var r = this.nextToken(s);
		switch(r.type){
		case TOKEN_STRING:
			measure.elements.push(new Chord(r.token));
			s = r.s;
			break;
		case TOKEN_STRING_SQ:
			var comment = new Comment(r.token, atmark_detected);
			if(atmark_detected){
				associated_chord.setException(comment);
				atmark_detected = false;
				associated_chord = null;
			}
			measure.elements.push(comment);
			s = r.s;
			break;
		case TOKEN_STRING_GRAVE_ACCENT:
			var lyric = new Lyric(r.token, atmark_detected);
			if(atmark_detected){
				associated_chord.setLyric(lyric);
				atmark_detected = false;
				associated_chord = null;
			}
			measure.elements.push(lyric);
			s = r.s;
			break;
		case TOKEN_ATMARK:
			var a_chord = measure.elements[measure.elements.length-1];
			if(!(a_chord instanceof Chord))
				throw "ATMARK_NOT_AFTER_CHORD_SYMBOL";
			associated_chord = a_chord;
			atmark_detected = true;
			s = r.s;
			break;
		case TOKEN_WORD:
			// Analyze Rest symbol
			var rr = this.parseRest(r.token, r.type, r.s);
			if(rr.rest !== null){
				measure.elements.push(rr.rest);
				s = rr.s;
				break;
			}
			// To SLASH or COLON
		case TOKEN_SLASH:
		case TOKEN_COLON:
			var r = this.parseChordSymbol(r.token, r.type, r.s);
			measure.elements.push(r.chord);
			s = r.s;
			break;
		case TOKEN_BRACKET_LA:
			var r = this.parseSign(r.type, r.s);
			measure.elements.push(r.sign);
			s = r.s;
			break;
		case TOKEN_BRACKET_LR:
			var r = this.parseTime(r.type, r.s);
			measure.elements.push(r.time);
			s = r.s;
			break;
		case TOKEN_BRACKET_LS:
			var r = this.parseLoopIndicator(r.type, r.s);
			measure.elements.push(r.loopIndicator);
			s = r.s;
			break;
		case TOKEN_BRACKET_LW:
			var r = this.parseLongRestIndicator(r.type, r.s);
			measure.elements.push(r.longRestIndicator);
			s = r.s;
			break;
		case TOKEN_MB:
			measure.elements.push(new MeasureBoundaryMark(1));
			loop_flg = false;
			break;
		case TOKEN_MB_DBL:
			measure.elements.push(new MeasureBoundaryMark(2));
			loop_flg = false;
			break;
		case TOKEN_MB_LOOP_END:
			measure.elements.push(new LoopEndMark(r.param));
			loop_flg = false;
			break;
		case TOKEN_MB_LOOP_BEGIN:
			measure.elements.push(new LoopBeginMark());
			loop_flg = false;
			break;
		case TOKEN_MB_LOOP_BOTH:
			measure.elements.push(new LoopBothMark(r.param));
			loop_flg = false;
			break;
		case TOKEN_MB_FIN:
			measure.elements.push(new MeasureBoundaryFinMark());
			loop_flg = false;
			break;
		default:
			this.onParseError("ERROR_WHILE_PARSE_MEASURE");
			break;
		}
	}

	return {measure: measure, s:s};
};

Parser.prototype.parseMeasures = function(trig_token_obj, s, double_line_break)
{
	// prerequisite :
	//   trig_token_obj == "|" or "||" or "||:" with params
	// After calling this method, context will be out of measure context, that is,
	// last boundary will be consumed.
	var measures = new Array();
	var loop_flg = true;
	while(loop_flg){
		var r = this.parseMeasure(trig_token_obj, s);
		s = r.s;
		measures.push(r.measure);
		r = this.nextToken(s);
		s = r.s;
		switch(r.type){
		case TOKEN_MB:
		case TOKEN_MB_DBL:
		case TOKEN_MB_LOOP_BEGIN:
		case TOKEN_MB_LOOP_END:
		case TOKEN_MB_LOOP_BOTH:
		case TOKEN_MB_FIN:
			var tr = this.nextToken(s);
			switch(tr.type){
			case TOKEN_NL:
				loop_flg = false;
				break;
			case TOKEN_END:
				loop_flg = false;
				break;
			default:
				// Measure definition is continuing
				trig_token_obj = r;
			}
			break;
		default:
			this.onParseError("ERROR_WHILE_PARSE_MEASURES");
			break;
		}
	}

	return {measures:measures, s:s};
};

Parser.prototype.parseMacro = function(s)
{
	var key = null;
	var value = null;
	var r = this.nextToken(s);
	if(r.type != TOKEN_WORD) this.onParseError("ERROR_WHILE_PARSE_MACRO");
	key = r.token;
	s = r.s;
	var r = this.nextToken(s);
	if(r.type != TOKEN_EQUAL) this.onParseError("ERROR_WHILE_PARSE_MACRO");
	s = r.s;
	var r = this.nextToken(s);
	if(r.type != TOKEN_STRING) this.onParseError("ERROR_WHILE_PARSE_MACRO");
	s = r.s;
	value = r.token;
	return {key:key, value:value, s:s};
};

Parser.prototype.glanceHeader = function(s)
{
	var targetMacros = ["TITLE","ARTIST"];
	var headers = {};
	var c = s.split("\n");
	for(var i = 0; i < c.length; ++i){
		if(c[i].length > 0 && c[i][0] == '%'){
			var r = this.parseMacro(c[i].substr(1));
			if (targetMacros.indexOf(r.key) >= 0)
				headers[r.key]=r.value;
			if(headers.length == targetMacros.length)
				break;
		}
	}
	return headers;
};

Parser.prototype.parse = function(s)
{
	s.replace(/\r\n/g,"\n");
	s.replace(/\r/g,"\n");
	var r = null;
	var loop_cnt = 0;

	var track = new Track();

	var currentReharsalGroup = null;
	var currentBlock = null;

	while(true){
		r = this.nextToken(s);
		//console.log(r);
		if(r.type == TOKEN_END) break;

		if(r.type == TOKEN_NL){
			this.context.line += 1;
			this.context.contiguous_line_break += 1;
		}else{
			if(r.type == TOKEN_BRACKET_LS){
				r = this.parseReharsalMark(r.token, r.s);
				//console.log("Reharsal Mark:"+r.reharsalMarkName);
				if(currentReharsalGroup != null)
					track.reharsal_groups.push(currentReharsalGroup);
				currentReharsalGroup = new ReharsalGroup();
				currentReharsalGroup.name = r.reharsalMarkName;
			}else if([TOKEN_MB, TOKEN_MB_DBL, TOKEN_MB_LOOP_BEGIN, TOKEN_MB_LOOP_BOTH, TOKEN_MB_FIN].indexOf(r.type) >= 0){
				r = this.parseMeasures(r, r.s);
				if( currentReharsalGroup.blocks.length == 0 ){
					currentReharsalGroup.blocks.push(new Array());
					currentReharsalGroup.blocks[0] =
						currentReharsalGroup.blocks[0].concat(r.measures);
				}else{
					if(this.context.contiguous_line_break >= 2){
						currentReharsalGroup.blocks.push(new Array());
					}
					var blocklen = currentReharsalGroup.blocks.length;
					currentReharsalGroup.blocks[blocklen-1] =
						currentReharsalGroup.blocks[blocklen-1].concat(r.measures);
				}
				//currentReharsalGroup.measures =
				//	currentReharsalGroup.measures.concat(r.measures);
			}else if(r.type == TOKEN_PERCENT){
				// Expression
				r = this.parseMacro(r.s);
				if(currentReharsalGroup){
					currentReharsalGroup.macros[r.key] = r.value;
				}else{
					track.macros[r.key] = r.value;
				}
			}else if(r.type == TOKEN_NL){
				// Process will be done in the if statement below
			}else{
				console.log(r.token);
				this.onParseError("ERROR_WHILE_PARSE_MOST_OUTSIDER");
			}
			this.context.contiguous_line_break = 0;
		}
		s = r.s;
		loop_cnt++;
		if(loop_cnt >= 1000) break;
	}

	if(currentReharsalGroup != null){
		track.reharsal_groups.push(currentReharsalGroup);
		currentReharsalGroup = null;
	}

	// If same reharsal mark appears, preceeding one is applied
	var rgmap = {};
	for(var i = 0; i < track.reharsal_groups.length; ++i)
	{
		var rg = track.reharsal_groups[i];
		if(rg.name in rgmap){
			track.reharsal_groups[i] = $.extend(true, {}, rgmap[rg.name]); // Deep Copy
		}else{
			rgmap[rg.name] = rg;
		}
	}

	return track;
};


//
// Rendering Engine
//

function Renderer(canvas, paper_width, paper_height)
{
	this.canvas = canvas;
	this.param = RENDER_PARAM; // Default parameters
	// Overwrite
	this.param.paper_width = paper_width;
	this.param.paper_height = paper_height;
	this.track = null;
}

function ctxlt(c0, c1)
{
	if(c0.rgi < c1.rgi) return true;
	else if(c0.rgi > c1.rgi) return false;
	else if(c0.mi < c1.mi) return true;
	else return false;
}

function ctxeq(c0, c1)
{
	return c0.rgi == c1.rgi && c0.mi == c1.mi;
}

function ctxlte(c0, c1)
{
	return ctxlt(c0, c1) || ctxeq(c0, c1);
}

/*
 * Sequencer class.
 *
 * track : Track object including rendering information by Rederer object
 * cb_play : Callback function called when sequencer is played.
 * cb_stop : Callback function called when sequencer is stopped.
 * param : Sequencer configurable parameters
 * 		auto_scroll : Auto scroll On/Off
 */
function Sequencer(track, cb_play, cb_stop, param)
{
	if(param === undefined)	param = {};
	// Default sequencer prameters
	if(param.auto_scroll === undefined) param.auto_scroll = false; // Auto scroll On/Off

	this.param = param;

	this.sequence = [];
	this.hasValidStructure = false;

	this.cb_play = cb_play == undefined ? null : cb_play;
	this.cb_stop = cb_stop == undefined ? null : cb_stop;

	this.lastloopstart = {rg: null, m: null};
	this.segnos = {};


	// Analyze musical structure
	var ctx = { rgi: 0, bi: 0, mi: -1};
	var at = function(c){
		return track.reharsal_groups[c.rgi].blocks[c.bi][c.mi];
	};
	var next = function(c){
		do {
			if(c.rgi >= track.reharsal_groups.length)
				return null;
			c.mi++;
			if(c.mi >= track.reharsal_groups[c.rgi].blocks[c.bi].length){
				c.mi = 0;
				c.bi++;
				if(c.bi >= track.reharsal_groups[c.rgi].blocks.length){
					c.bi = 0;
					c.rgi++;
					if(c.rgi >= track.reharsal_groups.length)
						return null;
				}
			}
			//if(c.rgi < track.reharsal_groups.length && c.mi < track.reharsal_groups[c.rgi].measures.length)
			return track.reharsal_groups[c.rgi].blocks[c.bi][c.mi];
		} while( true );
	};

	var current_time_mark = new Time(4,4);
	var current_time = 0;

	var m = next(ctx);
	var startm = m;
	var startctx = deepcopy(ctx);
	var cur_loop = null;
	var segnos = {};
	var codas = {};
	var tocodas = {};
	var fine = null;
	var maxloop = 1000;
	var loopcnt = 0;
	while(m){
		if(loopcnt++ > maxloop){
			throw "Error : Analyzing error : Infinite loop detected.";
		}
		var nextneeded = true;
		var elems = classifyElements(m);

		// There is a limination that loop start and loop indicator can not exist in the same measure.
		var jumploopindicator = false;
		for( var ei = 0; ei < elems.measure_wide.length; ++ei){
			var e = elems.measure_wide[ei];
			if( e instanceof LoopIndicator ){
				if(cur_loop){
					if(e.intindicators.indexOf(cur_loop.cnt) >= 0){
						break;
					}else{
						// Skip to the measure which has target loop indicator
						while(m = next(ctx)){
							if(findElement(m,function(ec){
								return ( ec instanceof LoopIndicator ) &&
									   ( ec.intindicators.indexOf(cur_loop.cnt) >= 0 )}))
							{
								jumploopindicator = true;
								break;
							}
						}
					}
					break;
				}else{
					throw "Invalid loop indicator detected";
				}
			}
		}

		if(jumploopindicator)
			continue;

		// Check if long rest indicator exists. If exists, just duplicate sequence for that duration.
		var longrest = null;
		for( var ei = 0; ei < elems.measure_wide.length; ++ei){
			var e = elems.measure_wide[ei];
			if( e instanceof LongRestIndicator ){
				longrest = parseInt(e.longrestlen);
			}
		}

		for( var ei = 0; ei < elems.header.length; ++ei ){
			var e = elems.header[ei];
			if( e instanceof LoopBeginMark || e instanceof LoopBothMark){
				if(cur_loop && ctxeq(cur_loop.p, ctx)){
					// In only, same position.
					cur_loop.cnt++;
				}else{
					cur_loop = { p:deepcopy(ctx),cnt: 1};
				}
			}else if( e instanceof Segno){
				if(e.numnber in segnos){

				}else{
					segnos[e.number] = { p:deepcopy(ctx)};
				}
			}else if( e instanceof Coda ){
				// TODO
			}else if( e instanceof Time ){
				current_time_mark = e;
			}
		}

		if(longrest !== null){
			for(var i = 0; i < longrest ; ++i){
				var seqprop = {
					t: current_time,
					duration : (current_time_mark.numer / current_time_mark.denom)
				};

				this.sequence.push([seqprop, m]);
				current_time += seqprop.duration;
			}
		}else{
			// No long rest (corresponding to longrest = 1)
			var seqprop = {
				t: current_time,
				duration : (current_time_mark.numer / current_time_mark.denom)
			};

			this.sequence.push([seqprop, m]);
			current_time += seqprop.duration;
		}

		console.log("Push : ");
		console.log(m);
		console.log(seqprop);

		var validfinedetected = false;

		for ( var ei = 0; ei < elems.footer.length; ++ei){
			var e = elems.footer[ei];
			if( e instanceof LoopEndMark || e instanceof LoopBothMark){
				if(cur_loop.cnt < e.times){
					m = at(cur_loop.p);
					ctx = deepcopy(cur_loop.p);
					nextneeded = false;
					break;
				}else{
					cur_loop = null;
				}
			}else if( e instanceof DalSegno ){
				if(e.number in segnos){
					// All the toCoda between segno position and current position
					// are marked as valid
					for(var key in tocodas){
						if( ctxlt(tocodas[key].p, ctx) && ctxlte(segnos[e.number].p, tocodas[key].p))
							tocodas[key].valid = true;
					}
					// If fine is placed between Segno and DalSegno, marked as valid
					if(fine){
						if( ctxlt(fine.p, ctx) && ctxlte(startctx, fine.p ) )
							fine.valid = true;
					}
					m = at(segnos[e.number].p);
					ctx = deepcopy(segnos[e.number].p);
					nextneeded = false;
					// Loop should be reset in general.
					// TODO : If segno is in the middle of loop, cur_loop should be set
					// to the last loopbegin mark.
					cur_loop = null;
				}else{
					throw "Segno not found";
				}
			}else if( e instanceof DaCapo ){
				// All the to Coda prior to current position is marked as valid
				for(var key in tocodas){
					if( ctxlt(tocodas[key].p, ctx) && ctxlte(startctx, tocodas[key].p ) )
						tocodas[key].valid = true;
				}
				// If fine is placed prior to current position, marked as valid.
				if(fine){
					if( ctxlt(fine.p, ctx) && ctxlte(startctx, fine.p ) )
						fine.valid = true;
				}
				m = startm;
				ctx = deepcopy(startctx);
				nextneeded = false;
				// Loop should be reset in general.
				cur_loop = null;
				break;
			}else if( e instanceof ToCoda){
				if(e.number in tocodas && tocodas[e.number].valid){
					// Skip to the measure which has coda mark
					nextneeded = false;
					while(m = next(ctx)){
						if(findElement(m,function(ec){ return ( ec instanceof Coda ) && ec.number == e.number; })){
							break;
						}
					}
					break;
				}else{
					tocodas[e.number] = {valid:false, p:deepcopy(ctx)};
				}
			}else if( e instanceof Fine){
				if(!fine){
					fine = {valid:false, p:deepcopy(ctx)};
				}else if(fine.valid){
					validfinedetected = true;
				}
			}
		}

		if(validfinedetected){
			break; // End of a song
		}

		if(nextneeded){
			m = next(ctx);
		}
	}
}

Sequencer.prototype.auto_scroll = function(onoff)
{
	this.param.auto_scroll = onoff;
};

Sequencer.prototype.play = function(tempo)
{
	if(this.timerid){
		return; // Already played
	}
	this.timerStart = Date.now();
	this.tempo_bpm = tempo;

	this.cmi = 0;

	var me = this;
	this.timerid = setInterval(function(){ me.onClock();}, 100);
	this.onClock();
	if(this.cb_play){
		this.cb_play();
	}
};

Sequencer.prototype.stop = function()
{
	if(this.timerid){
		clearInterval(this.timerid);
		this.timerid = null;
		if(this.lastindicator){ this.lastindicator.remove(); this.lastindicator = null; }
		if(this.cb_stop){
			this.cb_stop();
		}
	}
};

Sequencer.prototype.onClock = function()
{
	var now = Date.now();
	var diff = now - this.timerStart; // ms

	var seq = this.sequence;

	var measure_length = (1.0 / this.tempo_bpm ) * 60 * 1000 * 4; // ms // TODO : "4" should be changed due to initial time mark.

	for(; this.cmi < seq.length; ++this.cmi){
		if( diff >= seq[this.cmi][0].t * measure_length &&
			diff < (seq[this.cmi][0].t + seq[this.cmi][0].duration) * measure_length){
			break;
		}
	}

	if(this.cmi >= seq.length){
		this.stop();
		return;
	}

	var m = seq[this.cmi][1];
	var sx = m.renderprop.sx;
	var ex = m.renderprop.ex;
	var y = m.renderprop.y;
	if(this.lastindicator){ this.lastindicator.remove(); this.lastindicator = null; }
	this.lastindicator = m.renderprop.paper.rect(sx, y, ex-sx, 30).attr({fill:'red','fill-opacity':0.3,stroke:0});
	var offsetx = m.renderprop.paper.canvas.offsetLeft;
	var offsety = m.renderprop.paper.canvas.offsetTop;
	if(this.param.auto_scroll){
		window.scroll(0, offsety + y - $(window).height()/2);
	}
};

Renderer.prototype.render = function(track, async_mode, progress_cb)
{
	this.track = track;

	if(async_mode){
		Task.enqueueFunctionCall(render_impl, [this.canvas, track, true, this.param, async_mode, progress_cb], "render");
		Task.enqueueFunctionCall(identify_scaling, [track, this.param], "render");
		var task = Task.enqueueFunctionCall(render_impl, [this.canvas, track, false, this.param, async_mode, progress_cb], "render");
		return task;
	}else{
		render_impl(this.canvas, track, true, this.param, async_mode, progress_cb);
		// Esiate scaling factor
		identify_scaling(track, this.param);
		render_impl(this.canvas, track, false, this.param, async_mode, progress_cb);
	}
};

function classifyElements(measure)
{
	var m = measure;
	var header_elements = new Array();
	var body_elements = new Array();
	var footer_elements = new Array();
	var measure_wide_elements = new Array();

	for(var ei = 0; ei < m.elements.length; ++ei){
		var e = m.elements[ei];
		if(ei == 0){
			// First element must be boundary
			header_elements.push(e);
		}else if(ei == m.elements.length - 1){
			// Last element must be boundary
			footer_elements.push(e);
		}else{

			if(e instanceof Chord){
				body_elements.push(e);
			}else if(e instanceof Rest){
				body_elements.push(e);
			}else if(e instanceof LoopIndicator){
				measure_wide_elements.push(e);
			}else if(e instanceof LongRestIndicator){
				measure_wide_elements.push(e);
			}else if(e instanceof Time){
				// Time mark is treated as header element irrespective of its positionat the second element is treated as header part
				header_elements.push(e);
			}else if(e instanceof DaCapo){
				footer_elements.push(e);
			}else if(e instanceof DalSegno){
				footer_elements.push(e);
			}else if(e instanceof Segno){
				header_elements.push(e);
			}else if(e instanceof Coda){
				header_elements.push(e);
			}else if(e instanceof ToCoda){
				footer_elements.push(e);
			}else if(e instanceof Fine){
				footer_elements.push(e);
			}else if(e instanceof Comment){
				header_elements.push(e);
			}else if(e instanceof Lyric){
				header_elements.push(e);
			}else if(e instanceof ArMark){
				// Associate the Chord and Comment or Lyric symbols here
				var chord = m.elements[ei-1];
				var obj = m.elements[ei+1];

			}
		}

	}

	return {header:header_elements, body:body_elements, footer:footer_elements, measure_wide:measure_wide_elements};
}

function findElement(measure, cond)
{
	var m = measure;
	for(var ei = 0; ei < m.elements.length; ++ei){
		var e = m.elements[ei];
		if(cond(e)){
			return e;
		}
	}
	return null;
}

function maxtor(array, indexer, functor)
{
	var cnt = 0;
	var i = null;
	var maxv = null;
	while((i = indexer(cnt++))!==null && i<array.length){
		var r = functor !== undefined ? functor(array[i]) : array[i];
		maxv =  maxv === null ? r : Math.max(r, maxv);
	}
	return maxv;
}

// This function is called right after screening is done.
function identify_scaling(track, param)
{
	console.log("Identify scaling called");
	var width = param.paper_width - param.x_offset * 2 - track.pre_render_info["meas_left_offset"];

	for(var i = 0; i < track.reharsal_groups.length; ++i)
	{
		var rg = track.reharsal_groups[i];

		for( var bi = 0; bi < rg.blocks.length; ++bi){

			var block_measures = rg.blocks[bi];

			var currentSumWidth = 0;

			var rows = new Array();
			var row_measures = new Array();

			var vertical_align = true;
			var force_even_measures_per_line = true;
			if(vertical_align){
				// Estimate optimized TR line-break point
				// Decide where to insert line-break
				var maxC = 0;
				for(var ml = 0; ml < block_measures.length; ++ml){
					maxC = ml+1;
					var m = block_measures[ml];
					currentSumWidth += (m.header_width + m.body_width + m.footer_width);
					//console.log(m.header_width + "/" + m.body_width + "/" + m.footer_width + ":" + currentSumWidth + " vs " + width);
					if(currentSumWidth > width){ maxC--; break; }
				}

				//console.log("maxC = " + maxC);
				var N = block_measures.length;
				var C = maxC;
				var meas_max_widths = new Array();
				var Q_w_for_C = 0;
				for(; C > 0; --C){
					for(var c = 0; c < C; ++c){
						var max_w_for_c = maxtor(block_measures, function(r){ return r*C+c; }, function(m){ return m.header_width + m.body_width + m.footer_width;});
						Q_w_for_C += max_w_for_c;
						meas_max_widths.push(max_w_for_c);
					}
					// Semi-optimized selection : argmax{C} Q_w_for_C is optimzed but, here we choose maximum C where Q_w_for_C <= P_w
					if(Q_w_for_C <= width)
					{
						// Even measures should be used, skip odd measures case except for C=1 or 1 line case
						if(force_even_measures_per_line){
							if(C % 2 == 0 || C == 1 || C == N) break;
						}
						else
							break;
					}
					Q_w_for_C = 0;
					meas_max_widths = new Array();
				}
				// Now, C is number of columns per row
				// Q_w_for_C is width of the row when number of column is C, that is, sum of the maximum width measure of each columns.
				// meas_max_widths is width of the measure with maximum width in each column. Sum of meas_max_widths equals to Q_w_for_C.

				// Additional scaling to variable of width of columns
				var limitvariation = true;
				if(limitvariation){
					var sdratio = 0.75; // ratio of standard deviation. sigma_target/sigma. 0 means all the column bcomes the same width(average width).
					var avg = 0.0;
					for(var c = 0; c < C; ++c)
						avg += meas_max_widths[c];
					avg /= C;
					Q_w_for_C = 0;
					for(var c = 0; c < C; ++c){
						meas_max_widths[c] = meas_max_widths[c] - ( meas_max_widths[c] - avg ) * ( 1 - sdratio );
						Q_w_for_C += meas_max_widths[c];
					}
				}

				// Calculate new body width and scaling
				var reharsal_wide_scaling = width / Q_w_for_C;
				for(var ml = 0; ml < block_measures.length; ++ml){
					var m = block_measures[ml];
					var row = Math.floor(ml / C);
					var col = ml - row * C;
					var new_body_width = meas_max_widths[col] * reharsal_wide_scaling - (m.header_width + m.footer_width);
					m.new_line = ( col == 0 && row > 0 );
					m.body_scaling = new_body_width / m.body_width;

					// Limit scaling to 1.00 for the case of single row to avoid the too much extension of the measure
					// Physiological effect that 4 >= columns should occupy whole width.
					if(block_measures.length == C && C <= 3){
						m.body_scaling = Math.min(1.5, m.body_scaling);
					}
				}

			}else{
				// Decide where to insert line-break
				for(var ml = 0; ml < block_measures.length; ++ml){
					var m = block_measures[ml];

					row_measures.push(m);
					currentSumWidth += (m.header_width + m.body_width + m.footer_width);

					if(currentSumWidth > width){
						rows.push(row_measures);
						row_measures = new Array();
						currentSumWidth = 0;
					}
				}
				if( row_measures.length > 0 )
					rows.push(row_measures);

				// Decide scaling factor for each measure.
				// Align measure boundary as much as possible.
				for(var ri = 0; ri < rows.length; ++ri)
				{
					var sumWidth = 0;
					var sumFixedWidth = 0;

					for(var ml = 0; ml < rows[ri].length; ++ml){
						var m = rows[ri][ml];
						if(ri > 0 && ml == 0) m.new_line = true;
						sumWidth += (m.header_width + m.body_width + m.footer_width);
						sumFixedWidth += (m.header_width + m.footer_width);
					}

					var newSumBodyWidth = width - sumFixedWidth;
					if(newSumBodyWidth <= 0) throw "ERROR";

					var scaling = newSumBodyWidth / ( sumWidth - sumFixedWidth );
					for(var ml = 0; ml < rows[ri].length; ++ml){
						var m = rows[ri][ml];
						m.body_scaling = Math.min(param.max_scaling, scaling);
					}
				}
			}
		}
	}
}

Renderer.prototype.clear = function()
{
	for(var i = 0; i < pages.length; ++i){
		pages[i].clear();
	}
	$(this.canvas).children().remove();
	pages = new Array();
};

function makeNewPaper(canvas, param)
{
	var page_id = pages.length;
	$(canvas).append("<div id='page"+page_id+"'></div>"); // paper_div is jQuery object
	var paper_div=$(canvas).children("#page"+page_id)[0];
	paper = Raphael(paper_div, param.paper_width, param.paper_height);
	pages.push(paper);
	paper.canvas.style.backgroundColor = '#FFFFFF';

	// Logo:)
	raphaelText(paper, param.paper_width/2, param.paper_height - 40, "Generated by fumen ver 0.1", 12, "ct");

	// Clear buffers
	ChordRenderBuffer = {};

	return paper;
}

function get_boundary_sign(e)
{
	if(e === null)
		return 'n';
	else if(e instanceof MeasureBoundaryMark){
		if(e.nline == 1) return 's';
		else if(e.nline == 2) return 'd';
	}else if(e instanceof LoopBeginMark){
		return 'b';
	}else if(e instanceof LoopEndMark){
		return 'e';
	}else if(e instanceof LoopBothMark){
		return 'B';
	}else if(e instanceof MeasureBoundaryFinMark){
		return 'f';
	}
	throw "Invalid boundary object";
}

function boundary_type_without_line_break(b0, b1)
{
	// b0 and b1 must be either following characters
	// s : Single, d : Double, b: Loop Begin, e: Loop End, B: Loop Both, n:null
	var profile = {
		"ss":"s", "sd":"d",           "sb":"b",           "sn":"s",
		"ds":"d", "dd":"d",           "db":"b",           "dn":"d",
		"es":"e", "ed":"e", "ee":"e", "eb":"B",           "en":"e",
		                              "bb":"b",
		                                        "BB":"B",
		                                                  "fn":"f",
		"ns":"s", "nd":"d",           "nb":"b"
	};
	var key = get_boundary_sign(b0)+get_boundary_sign(b1);
	if(key in profile){
		return profile[key];
	}
	throw ("Invalid boundary pair : " + key);
}

function boundary_type_with_line_break(b0, b1, side)
{
	// b0 and b1 must be either following characters
	// s : Single, d : Double, b: Loop Begin, e: Loop End, B: Loop Both, n:null
	// side must be either 'end' or 'begin'
	var profile = {
		"ss":"ss", "sd":"sd",            "sb":"sb",
		"ds":"ds", "dd":"dd",            "db":"db",
		"es":"es", "ed":"ed", "ee":"es", "eb":"eb",
		                                 "bb":"sb",
		                                            "BB":"eb"
	};
	var key = get_boundary_sign(b0)+get_boundary_sign(b1);
	if(key in profile){
		return profile[key][side=="begin"?1:0];
	}
	throw ("Invalid boundary pair : " + key);
}



/**
 * Draw boundary
 * @param side : 'begin' or 'end' of boundary for current measure
 * @param ec : Boundary element of current measure( <side> side )
 * @param en : Boundary element of neighbor measure.
 *             <en> must be 'begin' boundary of the next measure when <side> is 'end'
 *             <en> must be 'end' boundary of the previous measure when <side> is 'begin'
 *             <en> can be null if there is no next measure when <side> is 'end'.
 *             <en> can be null if there is no previous measure when <side> is 'begin'.
 * @param hasNewLine : Whether there is "new line" at the place of the target boundary.
 * @param paper : Paper object
 * @param x : Current x position
 * @param darw : Whether to draw or just estimating sizes
 *
 * @return dictionary with following keys and values
 *             x : updated x position.
 */
function draw_boundary(side, e0, e1, hasNewLine, paper, x, y_body_base, param, draw)
{
	var row_height = param.row_height;

	var draw_type = null; // "s, d, lb, le, lb, f"


	var bx = x; // Actual boundary of measure. Depends on final drawn boundary type.

	if(side == 'end'){
		var thisIsLastMeasureInLine = (e1 === null) || ( hasNewLine );
		if(!thisIsLastMeasureInLine) return {x:x, bx:bx};
	}

	if(hasNewLine === null || hasNewLine == false){
		draw_type = boundary_type_without_line_break(e0, e1);
	}else{
		draw_type = boundary_type_with_line_break(e0, e1, side);
	}
	switch(draw_type){
	case 's':
	case 'd':
		var nline = draw_type == 's' ? 1 : 2;
		for(var li = 0; li < nline; ++li){
			if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});
			if(nline >= 2 && li < nline-1) x += 3;
		}
		bx = x;
		break;
	case 'b':
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"2"});
		x += 3;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});
		x += 4;
		if(draw) paper.circle(x, y_body_base + row_height/4*1.5, 1).attr({fill:"black"});
		if(draw) paper.circle(x, y_body_base + row_height/4*2.5, 1).attr({fill:"black"});
		break;
	case 'e':
		if(draw) paper.circle(x, y_body_base + row_height/4*1.5, 1).attr({fill:"black"});
		if(draw) paper.circle(x, y_body_base + row_height/4*2.5, 1).attr({fill:"black"});
		x += 4;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});
		x += 3;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"2"});
		//x += 20;
		if(e0.times !== null && (e0.ntimes || e0.times != 2)){
			stimes = e0.ntimes == true ? "X" : ""+e0.times;
			if(draw) text = raphaelText(paper, x, y_body_base + row_height + 8, "(" + stimes +" times)", 13, "rc");
		}
		bx = x;
		break;
	case 'B':
		if(draw) paper.circle(x, y_body_base + row_height/4*1.5, 1).attr({fill:"black"});
		if(draw) paper.circle(x, y_body_base + row_height/4*2.5, 1).attr({fill:"black"});
		x += 4;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});
		x += 3;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"2"});
		bx = x;
		x += 3;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});

		//x += 20;
		if(e0.times !== null && (e0.ntimes || e0.times != 2)){
			stimes = e0.ntimes == true ? "X" : ""+e0.times;
			if(draw) text = raphaelText(paper, x, y_body_base + row_height + 8, "(" + stimes +" times)", 13, "rc");
		}
		x += 4;
		if(draw) paper.circle(x, y_body_base + row_height/4*1.5, 1).attr({fill:"black"});
		if(draw) paper.circle(x, y_body_base + row_height/4*2.5, 1).attr({fill:"black"});
		break;
	case 'f':
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"1"});
		x += 3;
		if(draw) paper.path(svgLine(x, y_body_base, x, y_body_base + row_height)).attr({"stroke-width":"2"});
		break;
	default:
		throw "Internal error";
	}
	return {x:x, bx:bx};
}

function render_chord_as_string(chord, transpose, half_type, paper, x, y_body_base,
		param, draw, chord_space, x_global_scale, body_scaling)
{
	var row_height = param.row_height;

	var group = paper.set();

	var text = raphaelText(paper, x, y_body_base + row_height/2, chord.chord_str, 16, "lc", null);
	x += text.getBBox().width * x_global_scale * body_scaling;
	x += (chord_space*body_scaling);
	if(!draw) text.remove();

	group.push(text);

	return {group:group, x:x};
}

var ChordRenderBuffer = {

};

function render_chord(chord, transpose, half_type, paper, x, y_body_base,
		param, draw, C7_width, chord_space, x_global_scale, body_scaling, theme)
{
	var row_height = param.row_height;

	chord.renderprop.x = x;

	if(!chord.is_valid_chord)
	{
		return render_chord_as_string(chord, transpose, half_type, paper, x, y_body_base,
				param, draw, chord_space, x_global_scale, body_scaling);
	}

	var ref_p = [x, y_body_base];

	if(draw && chord.chord_name_str in ChordRenderBuffer)
	{
		var cl =  ChordRenderBuffer[chord.chord_name_str];
		var group = cl[0].clone();
		group.attr({opacity:1.0}); // Buffered symbol is transparent.
		var ref_p_0 = cl[1];
		group.transform("T " + (ref_p[0]-ref_p_0[0]) + " " + (ref_p[1]-ref_p_0[1]));
		x += group.getBBox().width * x_global_scale * body_scaling;
		x += (chord_space*body_scaling);
		if(!isFinite(x)){
			console.error("Illegal calculation of x detected");
		}
		return {group:group, x:x};
	}

	var bases = chord.getChordStrBase(transpose, half_type);
	var elems = chord.mid_elem_objs;
	var group = paper.set();

	// if bases are null, elems are null, then it is just a duration information
	if ( bases[0] == null && bases[1] == null && elems === undefined ){
		x += (C7_width * x_global_scale * body_scaling + chord_space * body_scaling);
		return {group:group, x:x};
	}

	var _3rdelem = [];
	var _5thelem = [];
	var _6791113suselem = [];
	var _alteredelem = []; // #11, #9, b9, #13, b13,

	if(elems){
		var _6exists = false, _9exists=false;
		for(var i = 0; i < elems.length; ++i){
			var e = elems[i];
			switch(e.type){
			case 'M':
				if(e.param !== undefined) _6791113suselem.push(e);
				else _3rdelem.push(e);
				break;
			case 'm': _3rdelem.push(e); break;
			case 'add': _6791113suselem.push(e); break;
			case 'sus': _6791113suselem.push(e); break;
			case 'dig':
				_6791113suselem.push(e);
				_6exists |= (e.param == '6');
				_9exists |= (e.param == '9');
				break;
			case 'b':
			case '#':
				if(e.param == '5')
					_5thelem.push(e);
				else
					_alteredelem.push(e);
				break;
			case 'dim': _6791113suselem.push(e); break;
			case 'alt': _alteredelem.push(e); break;
			}
		}

		// Exception for 69 chord
		if(_6exists && _9exists){
			// 6th will be moved to 5th left upper position
			for(var i = 0; i < _6791113suselem.length; ++i){
				if(_6791113suselem[i].type == 'dig' && _6791113suselem[i].param == '6'){
					_5thelem.push(_6791113suselem[i]);
					_6791113suselem.splice(i,1);
					break;
				}
			}
		}
	}

	var text = null;
	var xl = x;

	var fp = CHORD_RENDER_THEME[theme];
	var fontfamily = fp["_base_font_family"];

	if(bases[0]){
		var base_width = 0;
		for(var bi = 0; bi < bases[0].length; ++bi){
		//text = raphaelText(paper, xl, y_body_base + row_height/2, bases[0][0], fp["_base_font_size"], "lc", fontfamily);
		//var base_width = text.getBBox().width;
		//group.push(text);
		//if(bases[0].length==2){
			var fp2 = (bases[0][bi] in fp["_base_font_profile"]) ? fp["_base_font_profile"][bases[0][bi]]() : null;
			var _b2_font_family = (fp2 && fp2[0][3]) ? fp2[0][3] : fontfamily;
			var _b2_font_size = fp2 ? fp2[0][0] : fp["_base_font_size"];
			var _b2_char = fp2 ? fp2[0][2] : bases[0][bi];
			var _b2_yoffset = fp2 ? fp2[0][1] : 0;
			text = raphaelText(paper, xl + base_width, y_body_base + row_height/2 + _b2_yoffset,
				_b2_char, _b2_font_size, "lc", _b2_font_family);
			base_width += text.getBBox().width;
			group.push(text);
		}
		xl += base_width;
	}

	var wb3 = 0;
	if(_3rdelem.length > 0){
		var rp = fp["_3rd_font_profile"][_3rdelem[0].type](_3rdelem[0].param);
		var tx = 0;
		for(var i = 0; i < rp.length; ++i){
			text = raphaelText(paper, xl + tx,
					y_body_base + row_height/2 + rp[i][1] + fp["_3rd_global_dy"],
					rp[i][2], rp[i][0], "lc", fontfamily);
			group.push(text);
			tx += text.getBBox().width;
		}
		wb3 = tx;
	}
	var wbupper = 0;

	if(_5thelem.length > 0){
		var rp = fp["_5th_font_profile"][_5thelem[0].type](_5thelem[0].param);
		var tx = 0;
		for(var i = 0; i < rp.length; ++i){
			text = raphaelText(paper, xl + tx,
					y_body_base + row_height/2 + rp[i][1] + fp["_5th_global_dy"],
					rp[i][2], rp[i][0], "lc", fontfamily);
			group.push(text);
			tx += text.getBBox().width;
		}
		wbupper = tx;
	}

	var wblower = wb3;
	if(_6791113suselem.length > 0){
		var tx = 0;
		for(var n = 0; n < _6791113suselem.length; ++n){
			var rp= fp["_6791113_font_profile"][_6791113suselem[n].type](_6791113suselem[n].param);
			for(var i = 0; i < rp.length; ++i){
				if(rp[i][2] == "") continue;
				text = raphaelText(paper,
						xl + wb3 + tx,
						y_body_base + row_height/2 + rp[i][1] + fp["_6791113_global_dy"],
						rp[i][2], rp[i][0], "lc", fontfamily);
				tx += text.getBBox().width;
				group.push(text);
			}
		}
		wblower += tx;
	}

	xl += Math.max(wbupper, wblower);
	var aw = 0;
	var ah = 0; // Offset of y
	var a_min_y = 10000;
	var a_max_y = -10000;
	var brace_margin = 5;
	var multi_altered_margin = fp["_multi_altered_margin"];
	for(var i = 0; i < _alteredelem.length; ++i){
		var e = _alteredelem[i];
		var rp = fp["_altered_font_profile"][e.type](e.param);
		var tw = 0, th = 0;
		for(var k = 0; k < rp.length; ++k){
			text = raphaelText(paper,
					xl + brace_margin + tw,
					y_body_base + row_height/2 + ah + rp[k][1] + fp["_altered_global_dy"],
					rp[k][2], rp[k][0], "lc", (rp[k][3]?rp[k][3]:fontfamily));
			group.push(text);
			tw += text.getBBox().width;
			th = Math.max(th, text.getBBox().height);
			//a_min_y = Math.min(a_min_y, y_body_base + row_height/2 + ah + rp[k][1] + fp["_altered_global_dy"]);
			a_min_y = Math.min(a_min_y, text.getBBox().y);
			a_max_y = Math.max(a_max_y, text.getBBox().y + text.getBBox().height);
		}
		ah += (th+multi_altered_margin);
		aw = Math.max(aw, tw);
	}
	if(_alteredelem.length > 0){
		var brace_points_l = [[xl + brace_margin, a_min_y], [xl, a_min_y],
			[xl, a_max_y], [xl + brace_margin, a_max_y]];
		var bl = paper.path(svgArcBezie(brace_points_l)).attr('stroke-width','1px');

		var brace_points_r = [[xl + brace_margin+aw, a_min_y], [xl+brace_margin+aw+5, a_min_y],
			[xl+brace_margin+aw+5, a_max_y], [xl+brace_margin+aw, a_max_y]];
		var br = paper.path(svgArcBezie(brace_points_r)).attr('stroke-width','1px');

		group.push(bl);
		group.push(br);

		aw += brace_margin * 2;
	}

	xl += aw;
	if(bases[1])
	{
		var bassstr = "/"+bases[1];
		var on_bass_width = 0;
		for(var obi = 0; obi < bassstr.length; ++obi){
			var fp2 = (bassstr[obi] in fp["_on_bass_font_profile"]) ? fp["_on_bass_font_profile"][bassstr[obi]]() : null;
			var _b2_font_family = (fp2 && fp2[0][3]) ? fp2[0][3] : fontfamily;
			var _b2_font_size = fp2 ? fp2[0][0] : fp["_on_bass_font_size"];
			var _b2_char = fp2 ? fp2[0][2] : bassstr[obi];
			var _b2_yoffset = fp2 ? fp2[0][1] : 0;
			text = raphaelText(paper, xl + on_bass_width, y_body_base + row_height/2 + fp["_on_bass_global_dy"] + _b2_yoffset,
				_b2_char, _b2_font_size, "lc", _b2_font_family);
			on_bass_width += text.getBBox().width;
			group.push(text);
		}
		xl += on_bass_width;
	}

	x += group.getBBox().width * x_global_scale * body_scaling;
	x += (chord_space*body_scaling);
	if(!draw) text.remove();

	if(draw){
		var cloned = group.clone();
		cloned.attr({opacity:0.0}); // Buffered symbol must not be shown on the score.
		ChordRenderBuffer[chord.chord_name_str] = [cloned, ref_p];
	}
	if(!isFinite(x)){
		console.error("Illegal calculation of x detected");
	}
	return {group:group, x:x};
}

function raphaelSlash(paper, group, x, y, d, numdot)
{
	var rsgw = 10;
	var rsgh = 10;
	var rsh = 4;
	var rsw = 4;
	var path = svgPath( [[x,y],[x+rsgw,y-rsgh],[x+rsgw,y-rsgh+rsh],[x,y+rsh]], true);
	var obj = null;
	//var group = paper.set();
	if(d == '1' || d == '2'){
		obj = paper.path(path).attr({'stroke-width':'1px'});
	}else{
		// '0' and other
		obj = paper.path(path).attr({'fill':'#000000'});
	}
	group.push(obj);
	for(var i = 0; i < numdot; ++i){
		group.push( paper.circle(x+rsgw+5+i*5,y-6,1).attr({'fill':'black'}) );
	}
	return group;
}

/*
 * Group objs to the ones which has same values with 'field' ( Neighbor )
 */
function to_same_value_group(objs, comp)
{
	var ret = [];
	var tmp = [];
	var cur_v = null;
	for(var i = 0; i < objs.length; ++i){
		if(cur_v != null && cur_v != comp(objs[i])){
			ret.push(tmp);
			tmp = [];
		}
		cur_v = comp(objs[i]);
		tmp.push(objs[i]);
	}
	ret.push(tmp);
	return ret;
}

// Global variables to store the tie information across differnt measures
var rs_prev_coord = null;
var rs_prev_meas_coord = null;
var rs_prev_has_tie = false;
var rs_prev_tie_paper = null;

function render_empty_rythm_slash(paper, x_body_base, rs_y_base, _5lines_intv, body_width, numslash, body_scaling)
{
	var group = paper.set();
	for(var r = 0; r < numslash; ++r){
		var x = x_body_base + body_width / 4.0 * r;
		raphaelSlash(paper, group, x, (rs_y_base + _5lines_intv*2.5), '0', 0);
	}
}

function myLog2(integer)
{
	var log2 = {
			1:0,
			2:1,
			4:2,
			8:3,
			16:4,
			32:5,
			64:6,
			128:7
	};
	return log2[integer];
}

function draw_balken(paper, group, balken, rs_y_base, _5lines_intv, meas_start_x, meas_end_x, barlen, flagintv, balken_width)
{
	// Evaluate the flag direction(up or down) by the center of the y-axis position of all the notes/slashes
	var center_y = 0.0;
	var min_y = 10000000;
	var max_y = 0;
	var x_at_min_y = null;
	var x_at_max_y = null;
	var cnt_y = 0;
	for(var gbi=0; gbi < balken.groups.length;++gbi){
		var c = balken.groups[gbi].coord;
		for(var ci=0; ci<c[1].length;++ci){
			center_y += c[1][ci];
			if(min_y > c[1][ci]){
				min_y = c[1][ci];
				x_at_min_y = c[0];
			}
			if(max_y < c[1][ci]){
				max_y = c[1][ci];
				x_at_max_y = c[0];
			}
			cnt_y += 1;
		}
	}
	center_y = Math.floor(center_y / cnt_y);
	var upper_flag = center_y > (rs_y_base + _5lines_intv*2.5);

	var ps = balken.groups[0].coord;
	var pe = balken.groups[balken.groups.length-1].coord;

	if(balken.groups.length >= 2){
		var delta_y = upper_flag ? Math.min.apply(null,pe[1]) - Math.min.apply(null,ps[1]) :
			Math.max.apply(null,pe[1]) - Math.max.apply(null,ps[1]);
		var slope = delta_y / (pe[0] - ps[0]);
	}else{
		var slope = 1.0; // any value is OK
	}

	var intercept = (upper_flag ? min_y-barlen : max_y+barlen) - slope * (upper_flag ? x_at_min_y : x_at_max_y);

	// if flag is upper, then the balken is shifted +deltax, then intercept is updated.
	var deltax = upper_flag ? 8 : 0;
	intercept = intercept - slope * deltax;

	// Draw slash or notes
	for(var gbi=0; gbi < balken.groups.length;++gbi){
		var x = balken.groups[gbi].coord[0];
		var ys = balken.groups[gbi].coord[1];
		var d = balken.groups[gbi].onka;
		var pos_on_5lines = balken.groups[gbi].pos_on_5lines;

		if(balken.groups[gbi].type == "slash"){
			var numdot = balken.groups[gbi].numdot;
			if(d == '0' || d == '1'){
				raphaelSlash(paper, group, x, (rs_y_base + _5lines_intv*2.5), d, numdot);
			}else{
				raphaelSlash(paper, group, x, (rs_y_base + _5lines_intv*2.5), d, numdot);
				var o = paper.path("M"+x+","+(rs_y_base + _5lines_intv*2.5) + "L"+x+","+((rs_y_base + _5lines_intv*2.5)+barlen)).attr({'stroke-width':'1px'});
				group.push(o);
			}
		}else if(balken.groups[gbi].type == "notes"){
			for(var ci=0; ci < ys.length; ++ci){
				var y = ys[ci];
				if(d == '0'){
				}else if(d == '1'){
					text = raphaelText(paper, x, y,
						'\ue700', 7, "lc", "smart_music_symbol");
				}else if(d == '2'){
					text = raphaelText(paper, x, y,
						'\ue701', 7, "lc", "smart_music_symbol");
				}else{
					text = raphaelText(paper, x, y,
						'\ue702', 7, "lc", "smart_music_symbol");
				}
				group.push(text);

				// Draw additional lines
				for(var p5i = pos_on_5lines[ci]; p5i <= -2; ++p5i){
					if(p5i % 2 != 0) continue;
					var a5y = _5lines_intv/2 * (8 - p5i); // rs_y_base corresponds to pos#3
					var o = paper.path(svgLine(x-3, rs_y_base + a5y, x+12, rs_y_base + a5y)).attr({'stroke-width':'1px'});
					group.push(o);
				}
				for(var p5i = pos_on_5lines[ci]; p5i >=10; --p5i){
					if(p5i % 2 != 0) continue;
					var a5y = _5lines_intv/2 * (8 - p5i); // rs_y_base corresponds to pos#3
					var o = paper.path(svgLine(x-3, rs_y_base + a5y, x+12, rs_y_base + a5y)).attr({'stroke-width':'1px'});
					group.push(o);
				}
			}

			if(d == '0' || d == '1'){

			}else{
				var y0 = upper_flag ? Math.max.apply(null,ys) : Math.min.apply(null,ys);
				// Draw the basic vertical line. For the note with hat, some additional length will be added when to draw flags.
				var o = paper.path(svgLine(x+deltax, y0, x+deltax, slope*(x+deltax)+intercept)).attr({'stroke-width':'1px'});
				group.push(o);
			}
		}

		if(rs_prev_has_tie){
			// Draw tie line
			var pss = rs_prev_coord;
			var psm = rs_prev_meas_coord;

			// Check the consistency.
			if(pss[1].length != ys.length){
				throw "INVALID TIE NOTATION";
			}

			if(balken.groups[gbi].type == "slash"){
				// slash only has down flag
				var dy = -10;
				var sdx = 12;
				var round = 6;
			}else{ // notes
				if(upper_flag){
					var dy =  3;
					var sdx = 12;
					var round = -6;
				}else{
					var dy = -3;
					var sdx = 12;
					var round = 6;
				}
			}

			for(var ci=0; ci < ys.length; ++ci){
				var y = ys[ci];
				if(y != pss[1][ci]){
					// Crossing measure row. Previous RS mark could be on another page.
					// Make sure to create curve on the paper on which previous RS is drawn.
					var brace_points = [[pss[0] + sdx,pss[1][ci]+dy], [pss[0] + sdx, pss[1][ci]-round+dy],
															[psm[1]+20, pss[1][ci]-round+dy], [psm[1]+20,pss[1][ci]+dy]];
					clip = (pss[0]+sdx) + "," + (pss[1][ci]-50) + ","+(psm[1]-(pss[0]+sdx)+5)+",100";
					console.log("brace:"+brace_points);
					console.log("clip:"+clip);

					var bl = rs_prev_tie_paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px').attr({'clip-rect':clip});
					rs_prev_tie_paper.set().push(bl);

					brace_points = [[meas_start_x - 20, y+dy], [meas_start_x - 20, y-round+dy],
															[x, y-round+dy], [x,y+dy]];
					clip = (meas_start_x-5) + "," + (y-50) + ","+(x-(meas_start_x-5))+",100";
					//console.log("clip:"+clip);
					bl = paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px').attr({'clip-rect':clip});
					group.push(bl);
				}else{
					var brace_points = [[pss[0] + sdx,pss[1][ci]+dy], [pss[0] + sdx, pss[1][ci]-round+dy],
															[x, y-round+dy], [x,y+dy]];
					var bl = paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px');
					group.push(bl);
				}
			}
		}

		rs_prev_has_tie = balken.groups[gbi].has_tie;
		rs_prev_tie_paper = paper;
		rs_prev_coord = balken.groups[gbi].coord;
		rs_prev_meas_coord = [meas_start_x, meas_end_x];
	}

	if(balken.groups.length >= 2){
		// Draw flag for balken
		// Common balken
		var o = paper.path(svgLine(ps[0]+deltax, slope*(ps[0]+deltax)+intercept,
			pe[0]+deltax, slope*(pe[0]+deltax)+intercept)).attr({'stroke-width':balken_width});
		group.push(o);

		// Balken for each onka level
		var gg = to_same_value_group(balken.groups, function(o){return o.onka;});
		for(var g = 0; g < gg.length; ++g){
			var same_sds = gg[g];
			var sd = same_sds[0].onka;
			var numflag = myLog2(parseInt(sd)) - 2;

			if(same_sds.length == 1){
				var pss = same_sds[0].coord;

				// Determine which direction to draw flag. Determined from which neighboring
				// rhythm is more natural to coupling with.
				// Currently, simple strategy is adopted for now.
				var dir = 1;
				if(g == gg.length - 1) dir = -1;
				var neighbor_x = gg[g + dir][ gg[g+dir].length - 1 ].coord[0];
				var blen = Math.abs(neighbor_x - pss[0]) * 0.3;

				for(var fi = 1; fi < numflag; ++fi){ // fi=0 is alread drawn by common balken
					//o = paper.path(svgLine(pss[0], rs_y_base+barlen-fi*flagintv, pss[0] + dir * blen, rs_y_base+barlen-fi*flagintv)).attr({'stroke-width':balken_width});
					o = paper.path(svgLine(pss[0]+deltax, slope*(pss[0]+deltax)+intercept+(upper_flag?+1:-1)*fi*flagintv,
						pss[0]+deltax+dir*blen, slope*(pss[0]+deltax+dir*blen)+intercept+(upper_flag?+1:-1)*fi*flagintv)).attr({'stroke-width':balken_width});
					group.push(o);
				}
			}else if(same_sds.length >= 2){
				var pss = same_sds[0].coord;
				var pse = same_sds[same_sds.length-1].coord;
				for(var fi = 1; fi < numflag; ++fi) // fi=0 is alread drawn by common balken
				{
					var o = paper.path(svgLine(pss[0]+deltax,slope*(pss[0]+deltax)+intercept+(upper_flag?+1:-1)*fi*flagintv,
						pse[0]+deltax,slope*(pse[0]+deltax)+intercept+(upper_flag?+1:-1)*fi*flagintv)).attr({'stroke-width':balken_width});
					group.push(o);
				}
				if(same_sds[0].renpu){
					var ro = 12;
					var center_x = ((pss[0]+deltax) + (pse[0]+deltax))/2.0;
					var text = raphaelText(paper, center_x, slope*center_x+intercept+(upper_flag ? -ro : ro),
						same_sds[0].renpu+"", 12, "cc", "realbook_music_symbol");
					group.push(text);
				}
			}
		}
	}else if(balken.groups.length == 1){
		// Normal drawing of flags
		var x = balken.groups[0].coord[0];
		var d = balken.groups[0].onka;
		var numflag = myLog2(parseInt(d)) - 2;
		for(var fi = 0; fi < numflag; ++fi){
			//o = paper.path("M"+(ps[0]+10)+","+(rs_y_base+barlen-10-fi*flagintv) + "L"+(ps[0])+","+(rs_y_base+barlen-fi*flagintv)).attr({'stroke-width':'1px'});
			var text = raphaelText(paper, x+deltax, slope*(x+deltax)+intercept+(upper_flag ? 1+fi*6 : -1-fi*6),
				(upper_flag ? '\ue710' : '\ue711'), 16, "lc", "smart_music_symbol");
			group.push(text);
			// Additional vertical line
			var line  = paper.path(svgLine(x+deltax, slope*(x+deltax)+intercept, x+deltax, slope*(x+deltax)+intercept + (upper_flag ? - 8 : 8))).attr({'stroke-width':'1px'});
			group.push(line);
		}
	}
}

function render_rhythm_slash(elems, paper, rs_y_base, _5lines_intv, meas_start_x, meas_end_x,
		draw, chord_space, body_scaling, all_has_length)
{
	// chords is list of chords for each chord object has .renderprop.x property
	var balken_width = '4px';

	balken = {
		groups : [],
		sum_len : 0
	};

	var drawn = false;
	var group = paper.set();
	for(var ei = 0; ei < elems.length; ++ei){
		var e = elems[ei];

		// Rests also get into here but not drawn in this function.
		// Only the length is taken for Rest.
		if(e instanceof Rest){
			if(all_has_length) balken.sum_len += e.lengthIndicator.length;
			continue;
		}

		var x = e.renderprop.x;
		var barlen = 15;
		var flagintv = 5;
		var chord_length = 10000000;

		var rhythm_only = e.lengthIndicator !== null; //(e.length_s !== null && e.length_s !== undefined);
		var notes_only = e.nglist !== null; //(e.nglist !== null && e.nglist !== undefined);
		var group_y = [];
		var pos_on_5lines = []; // For notes only. bottom line is 0, second bottom line is 2, ... top line is 8
		var has_tie = false;

		if(rhythm_only){
			chord_length = e.lengthIndicator.length;
			var d = e.lengthIndicator.base; //e.length_s.match(/[0-9]+/)[0];
			var numdot = e.lengthIndicator.numdot; // = e.length_s.substr(d.length);
			has_tie = e.lengthIndicator.has_tie; //e.tie;

			drawn = true;

			group_y.push(parseInt(rs_y_base + _5lines_intv*2.5)); // center
			pos_on_5lines.push(4); // Not used, but put center line for now.
		}else if(notes_only){
			// notes_only
			drawn = true;
			// Currently only one ng is assumed
			for(var ngi=0; ngi < e.nglist.length; ++ngi){
				var ng = e.nglist[ngi];
				var nr = ng.nr;
				var d = ng.lengthIndicator.base; //ng.length_s.match(/[0-9]+/)[0];
				var numdot = ng.lengthIndicator.numdot; //ng.length_s.substr(d.length);
				chord_length = Math.min(ng.lengthIndicator.length,chord_length); // Take the note group of min-length. TODO for cater for multi-group notes
				has_tie = ng.lengthIndicator.has_tie; //ng.has_tie;

				for(var nri=0; nri < nr.length; ++nri){
					var dy = _5lines_intv/2; // 1/2 of interval of 5 lines
					var NLIST={'C':0,'D':1,'E':2,'F':3,'G':4,'A':5,'B':6};
					var yoffset = NLIST[nr[nri].note[0]]*dy  + dy*7*(nr[nri].note[2]-3); // C3 offset = 0
					var ypos = rs_y_base + dy*10 - yoffset; // rs_y_base corresopnds to the center of rs region and is corresponding to A3 when the notes are drawn with "top".
					var pos_on_5line = Math.round(yoffset/(dy)) - 2;
					group_y.push(ypos);
					pos_on_5lines.push(pos_on_5line);
				}
			}
		}else{
			continue;
		}

		if(all_has_length){
			// TODO : To cater for multi-group notes rendering

			// Flush current groups
			if(chord_length >= WHOLE_NOTE_LENGTH/4 && balken.groups.length > 0){
				draw_balken(paper, group, balken, rs_y_base, _5lines_intv, meas_start_x, meas_end_x, barlen, flagintv, balken_width);
				balken.groups = [];
			}
			balken.sum_len += chord_length;
			balken.groups.push({
				e : e,
				type : rhythm_only ? "slash" : "notes",
				numdot : numdot,
				coord : [e.renderprop.x, group_y],
				onka : d,
				has_tie : has_tie,
				pos_on_5lines : pos_on_5lines, // for notes only
				renpu : (e.lengthIndicator ? e.lengthIndicator.renpu : e.nglist[0].lengthIndicator.renpu)
			});
			if(chord_length >= WHOLE_NOTE_LENGTH/4 || balken.sum_len % (WHOLE_NOTE_LENGTH/4) == 0 || ei == elems.length-1){
				draw_balken(paper, group, balken, rs_y_base, _5lines_intv, meas_start_x, meas_end_x, barlen, flagintv, balken_width);
				balken.groups = [];
			}
		}
	}

	return drawn ? group : null;
}

// Rendering globals
var g_prev_chord_has_tie = false;

function init_render_global()
{
	g_prev_chord_has_tie = false;
}

function new_row_yinfo()
{
	var rowyinfo = {
		maxheaerheight : 0,
		maxbodyheight : 0,
		maxfooterheight : 0,
		maxheight: 0
	};
	return rowyinfo;
}

function render_measure_row(x, paper, x_global_scale, transpose, half_type,
		row_elements_list, reharsal_group, prev_measure, next_measure, y_base, param, draw, staff, theme,
		first_block_first_row, inner_reharsal_mark)
{
	/* Reference reserved width for empty measures or chord symbol without base names*/
	var text = raphaelText(paper, 0, 0,"C7", 16, "lc", "realbook_music_symbol");
	var C7_width = text.getBBox().width;
	text.remove();

	var rs_area_detected = false; // Rhthm Slash Area
	var mu_area_detected = false; // Measure Upper Area ( Above the chord symbol )
	var ml_area_detected = false; // Measure Lower Area ( Blow the chord & rhythm slash area)
	var lyric_rows = 0;

	var rest_or_long_rests_detected = false;

	//var draw_5line = false;
	if(staff == "ON"){
		rs_area_detected = true;
	}
	// interval of 5 lines
	var _5lines_intv = param.rs_area_height / (5-1);

	// Screening of y-axis areas
	for(var ml = 0; ml < row_elements_list.length; ++ml){
		var m = row_elements_list[ml];
		for(var ei = 0; ei < m.elements.length; ++ei)
		{
			var e = m.elements[ei];
			if(e instanceof Coda || e instanceof Segno || e instanceof Comment || e instanceof LoopIndicator || e instanceof ToCoda){
				mu_area_detected = true;
			}else if(e instanceof Chord){
				rs_area_detected |= (e.lengthIndicator !== null);
				rs_area_detected |= (e.nglist != null);
			}else if( e instanceof Lyric){
				ml_area_detected = true;
				lyric_rows = Math.max(e.lyric.split("/").length, lyric_rows);
			}

			if( e instanceof Rest || e instanceof LongRestIndicator ){
				rest_or_long_rests_detected = true;
			}
		}
	}
	if(staff == "OFF"){
		rs_area_detected = false;
	}

	var y_mu_area_base = y_base; // top of mu area(segno, coda, etc..)
	var y_body_base = y_base + (mu_area_detected ? param.mu_area_height+param.below_mu_area_margin : 0); // top of chord area
	var y_rs_area_base = y_body_base + (rs_area_detected ? (param.row_height+param.above_rs_area_margin) : 0 ); // top of rs area, note that this is same as y_body_base if rs are a is not drawn. Currenly rs height shoudl be equal to row height
	var y_ml_area_base = y_body_base + param.row_height
			+ (rs_area_detected ? param.rs_area_height + param.above_rs_area_margin : 0)
			+ param.above_ml_area_margin;

	var y_next_base = y_body_base + param.row_height
			+ (rs_area_detected ? param.rs_area_height + param.above_rs_area_margin : 0)
			+ (ml_area_detected ? lyric_rows * param.ml_row_height + param.above_ml_area_margin : 0)
			+ param.row_margin;
	if(false && draw){
	    var lines = [y_base, y_mu_area_base, y_body_base, y_rs_area_base, y_ml_area_base, y_next_base];
	    var colors = ["black","red","blue","green","orange","pink"];
	    for(var ii=0; ii<lines.length; ++ii)
    		paper.path(svgLine(0+ii*20, lines[ii], 100+ii*20, lines[ii])).attr({"stroke-width":"1","stroke":colors[ii]});
	}

	var measure_height = y_next_base - y_base;
	var measure_heights = [];

	var first_meas_start_x = x;
	var last_meas_end_x = x;

	// For each measure in this row
	for(var ml = 0; ml < row_elements_list.length; ++ml){
		// measure object
		var m = row_elements_list[ml];

		var meas_base_x = x;   // Start of this measure including boundary
		var meas_start_x = x;  // Start of this measure excluding boundary
		var meas_end_x = x;    // End of this measure
		var mh_offset = 0; // Offset x in mh region

		var elements = classifyElements(m);

		// Draw sub header field ( Repeat signs )
		var m_mu_area_detected = false;
		var m_ml_area_detected = false;
		for(var ei = 0; ei < elements.header.length; ++ei)
		{
			var e = elements.header[ei];
			if(e instanceof Coda){
				m_mu_area_detected = true;
				if(draw){
					var g = draw_coda(paper, meas_base_x + mh_offset, y_mu_area_base, "lt", e);
					mh_offset += g.getBBox().width;
				}
			}else if(e instanceof Segno){
				m_mu_area_detected = true;
				if(draw){
					var g = draw_segno(paper, meas_base_x + mh_offset, y_mu_area_base, e);
					mh_offset += g.getBBox().width;
				}
			}else if(e instanceof Comment){
				m_mu_area_detected = true;
				if(draw){
					// If this comment is associated with a chord with exceptional comment, not rendered here.
					if (!e.chorddep){
						var g = raphaelText(paper, meas_base_x + mh_offset, y_body_base, e.comment, 15, "lb");
						mh_offset += g.getBBox().width;
					}
				}
			}else if(e instanceof Lyric){
				m_ml_area_detected = true;
				if(draw){
					// If this comment is associated with a chord with exceptional comment, not rendered here.
					if (!e.chorddep){
						// Currently lyrics are only rendered for chord dependency case
					}
				}
			}
		}

		// Draw header
		var header_rs_area_width = 0;
		var header_body_area_width = 0;
		// Clef, Key, Begin Boundary, Time(1st one) are included in this area
		for(var ei = 0; ei < elements.header.length; ++ei)
		{
			var e = elements.header[ei];
			if(e instanceof MeasureBoundary)
			{
				var pm = ml == 0 ? prev_measure : row_elements_list[ml-1];
				var ne = pm ? pm.elements[ pm.elements.length - 1] : null;
				var r = draw_boundary('begin', ne, e, m.new_line, paper, x, y_rs_area_base, param, draw);
				m.renderprop.y = y_rs_area_base;
				m.renderprop.sx = x;
				m.renderprop.paper = paper;
				x = r.x;
				meas_start_x = r.bx;

				// Header 1. Reharsal mark in row
				if(inner_reharsal_mark && rs_area_detected && first_block_first_row && ml == 0){
					var g = raphaelTextWithBox(paper, meas_base_x, y_body_base, reharsal_group.name, param.reharsal_mark_font_size);
					header_body_area_width += g.getBBox().width;
				}
			}else if(e instanceof Time){
				x += 4;
				var hlw = 0;
				var lx = x;
				var textn = raphaelText(paper, lx, y_rs_area_base,                e.numer, 12, "lt", "realbook_music_symbol");
				hlw = textn.getBBox().width;
				var textd = raphaelText(paper, lx, y_rs_area_base + param.row_height/2, e.denom, 12, "lt", "realbook_music_symbol");
				hlw = Math.max(hlw, textd.getBBox().width);
				textn.attr({'x':textn.attr('x') + (hlw - textn.getBBox().width)/2});
				textd.attr({'x':textd.attr('x') + (hlw - textd.getBBox().width)/2});
				var ly = y_body_base + param.row_height/2;
				if(draw && (!rs_area_detected)) paper.path(svgLine(lx, ly, lx+hlw, ly)).attr({"stroke-width":"1"});
				//console.log("hlw = " + hlw);
				x += hlw;
			}
		}

		header_rs_area_width = x - meas_base_x;

		if(header_body_area_width > header_rs_area_width)
			x += (header_body_area_width - header_rs_area_width);

		// Margin between header and body
		x += param.header_body_margin;

		m.header_width = x - meas_base_x;

		// Draw body
		var body_base = x;

		// First, guess chord duration here.
		// In current version, each chord in the measure is assumed to have the same duration.
		// TODO : Improve based on number of spaces or duration indication mark.
		var num_chord_in_a_measure = 0;
		var all_has_length = true;
		var sum_length = 0.0;

		var chord_and_rests = [];
		for(var ei = 0; ei < elements.body.length; ++ei)
		{
			var e = elements.body[ei];
			if(e instanceof Chord || e instanceof Rest){
				++num_chord_in_a_measure;
				all_has_length &= (e.lengthIndicator !== null || e.nglist !== null);
				if(all_has_length){
					if(e.lengthIndicator)
						sum_length += e.lengthIndicator.length;
					else if(e.nglist)
						sum_length += e.nglist[0].lengthIndicator.length; // TODO : Multiple note groups
				}
				chord_and_rests.push(e);
			}
		}

		var chord_name_str = null;

		for(var ei = 0; ei < elements.body.length; ++ei)
		{
			var e = elements.body[ei];

			var chord_space = 0;
			if(all_has_length){
				var this_chord_len = 0;
				if(e.lengthIndicator)
					this_chord_len = e.lengthIndicator.length;
				else if(e.nglist)
					this_chord_len = e.nglist[0].lengthIndicator.length; // TODO : Multiple note groups
				chord_space = Math.floor(40*x_global_scale / sum_length*this_chord_len);
			}else
				chord_space = Math.floor(40*x_global_scale / num_chord_in_a_measure);

			if(e instanceof Chord){
				var cr = render_chord(e, transpose, half_type, paper, x, y_body_base,
						param, draw, C7_width, chord_space, x_global_scale, m.body_scaling, theme);
				if(e.exceptinal_comment !== null){
					if(draw)
						var g = raphaelText(paper, x, y_body_base,
							e.exceptinal_comment.comment, 15, "lb");
				}
				if(e.lyric !== null){
					if(draw){
						var llist = e.lyric.lyric.split("/");
						for(var li=0; li < llist.length; ++li){
							var g = raphaelText(paper, x, y_ml_area_base + li*param.ml_row_height,
								llist[li], 10, "lt");
						}
					}
				}
				x = cr.x;
				if(!isFinite(x)){
					console.log("Illegal calculation of x is detected");
				}
				// If chord is continued from the previous chord with tie, or
				// more than 1 adjacent valid chords are the same,
				// the chord(s) except the first one are not drawn. This is not applied for invalid chord.
				if(g_prev_chord_has_tie || (e.is_valid_chord && (chord_name_str == e.chord_name_str))){
					cr.group.remove(); // Not draw chord symbol
				}
				g_prev_chord_has_tie = ( e.lengthIndicator ? e.lengthIndicator.has_tie : false );
				chord_name_str = e.chord_name_str;
			}else if(e instanceof Rest){
				var cmap = {1:'\ue600', 2: '\ue601', 4:'\ue602', 8:'\ue603', 16: '\ue603', 32:'\ue603'};
				var yoffsets = {1:1, 2:-2, 4:0, 8:0, 16:7, 32:7, 64:14};
				var dot_xoffsets = {1:16, 2:16, 4:10, 8:12, 16:14, 32:16, 64:18};
				//var rd = parseInt(e.length_s);
				//var rrm = e.length_s.match(/([0-9]+)(\.*)/);
				var rd = e.lengthIndicator.base; //parseInt(rrm[1]);
				var numdot = e.lengthIndicator.numdot; //rm[2].length;
				var rg = paper.set();
				var oy = yoffsets[rd];
				var fs = 14;
				if(rd <= 4){
					var text = raphaelText(paper, x, y_rs_area_base + param.row_height/2 + oy, cmap[rd], fs, "lc", "realbook_music_symbol");
					rg.push(text);
				}else{
					var nKasane = myLog2(rd) - 2;
					var rdx = 2;
					var rdy = -7;
					for(var k = 0; k < nKasane; ++k){
						var text = raphaelText(paper, x + k*rdx, y_rs_area_base + param.row_height/2 + k*rdy + oy, '\ue603', fs, "lc", "realbook_music_symbol");
						rg.push(text);
					}
				}
				// dots
				for(var di = 0; di < numdot; ++di){
					rg.push( paper.circle(x + dot_xoffsets[rd] + di*5, y_rs_area_base + param.row_height/2 - _5lines_intv/2,1).attr({'fill':'black'}) );
				}
				//x += rg.getBBox().width * m.body_scaling;
				x += C7_width * x_global_scale * m.body_scaling;
				x += (chord_space*m.body_scaling);
				e.renderprop.x = x;
				if(!draw) rg.remove();

			}else{
				throw "ERROR";
			}
		}

		if(elements.body.length == 0)
		{
			// If no elements in body area, minimum width is reservied assuming 1 CM7 chord is located.
			x += C7_width * x_global_scale * m.body_scaling;
			x += (40*x_global_scale*m.body_scaling);
		}

		//console.log({x:x, body_base:body_base, scaling:m.body_scaling});
		m.body_width = x - body_base;

		// Draw footer
		var footer_base = x;
		for(var ei = 0; ei < elements.footer.length; ++ei)
		{
			// Basically, end boundary is not drawn for this measure because next measure
			// will draw it.
			// End boundary should be drawn only when this measure is the last
			// measure in current row.
			var lr = rs_area_detected ? 'l' : 'r';

			var e = elements.footer[ei];
			if(e instanceof MeasureBoundary)
			{
				var nm = (ml == row_elements_list.length-1) ? next_measure : row_elements_list[ml+1];
				var ne = nm ? nm.elements[0] : null;
				var r = draw_boundary('end', e, ne, nm ? nm.new_line : false, paper, x, y_rs_area_base, param, draw);
				m.renderprop.ex = x;
				x = r.x;
			}else if(e instanceof DaCapo){
				text = raphaelText(paper, x, y_rs_area_base　- 8 /* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
				if(rs_area_detected) x += text.getBBox().width;
			}else if(e instanceof DalSegno){
				text = raphaelText(paper, x, y_rs_area_base - 8 /* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
				if(rs_area_detected) x += text.getBBox().width;
			}else if(e instanceof ToCoda){
				if(rs_area_detected){
					var text = raphaelText(paper, x, y_rs_area_base, "To", 15, "lb").attr(param.repeat_mark_font);
					x += (text.getBBox().width + 5);
					var coda = draw_coda(paper, x, y_rs_area_base, "lb", e);
					x += coda.getBBox().width;
				}else{
					var coda = draw_coda(paper, x, y_rs_area_base, "rb", e);
					text = raphaelText(paper, x - coda.getBBox().width*1.5, y_rs_area_base, "To", 15, "rb").attr(param.repeat_mark_font);
				}
			}else if(e instanceof Fine){
				text = raphaelText(paper, x, y_rs_area_base - 8 /* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
				if(rs_area_detected) x += text.getBBox().width;
			}else{
				throw "ERROR";
			}
		}

		m.footer_width = x - footer_base;
		meas_end_x = x;
		last_meas_end_x = meas_end_x;

		// Draw Upper and Lower Signs
		for(var ei = 0; ei < elements.measure_wide.length; ++ei)
		{
			var e = elements.measure_wide[ei];
			if(e instanceof LoopIndicator){
				var oy = 10;
				var ly = y_body_base - 2 - oy;
				var sx = meas_start_x;
				var fx = meas_end_x;
				if(draw) paper.path(svgLine(sx, ly, sx, ly + oy)).attr({"stroke-width":"1"});
				if(draw) paper.path(svgLine(sx, ly, fx, ly)).attr({"stroke-width":"1"});
				var s = e.indicators.join(",");
				if(draw) raphaelText(paper, sx + 2, ly, s, 10, "lt");
			}else if(e instanceof LongRestIndicator){
				var sx = meas_start_x + m.header_width - param.header_body_margin; // More beautiful for long rest if header body margin is omitted
				var fx = meas_end_x - m.footer_width;
				var rh = param.row_height;
				var r_lrmargin = 0.05;
				var min_lrmargin = 5;
				var max_lrmargin = 20;
				var vlmargin = 0.2;

				lrmargin = Math.max( min_lrmargin, Math.min(max_lrmargin, (sx+fx) * r_lrmargin) );

				var lx = sx + lrmargin;
				var rx = fx - lrmargin;
				if(draw) paper.path(svgLine(lx, y_rs_area_base + param.row_height/2,
						rx, y_rs_area_base + param.row_height/2)).attr({"stroke-width":"7"});
				if(draw) paper.path(svgLine(lx, y_rs_area_base + rh * vlmargin,
						lx, y_rs_area_base + rh - rh * vlmargin)).attr({"stroke-width":"1"});
				if(draw) paper.path(svgLine(rx, y_rs_area_base + rh * vlmargin,
						rx, y_rs_area_base + rh - rh * vlmargin)).attr({"stroke-width":"1"});
				if(draw) raphaelText(paper, (sx+fx)/2, y_rs_area_base, e.longrestlen, 14, "cm","realbook_music_symbol");
			}else{
				throw "Unkown measure wide instance detected";
			}
		}

		// Draw Rythm Slashes
		if(rs_area_detected){
			var g = render_rhythm_slash(
					chord_and_rests, paper,
					y_rs_area_base,
					_5lines_intv,
					meas_start_x, meas_end_x,
					draw, 0, m.body_scaling, all_has_length);

			if((!g) && (!rest_or_long_rests_detected) ){
				render_empty_rythm_slash(paper, body_base, y_rs_area_base, _5lines_intv,
						m.body_width, 4, m.body_scaling);
			}
		}

		m.renderprop.meas_height = measure_height;
		measure_heights.push(measure_height);

	} // elements loop

	// Draw 5 lines
	if(rs_area_detected){
		for(var i = 0; i < 5; ++i){
			var intv = _5lines_intv;
			var dy = 0;
			if(draw) paper.path( svgLine([[first_meas_start_x, y_rs_area_base + i*intv + dy],[last_meas_end_x, y_rs_area_base + i*intv + dy]]) ).attr({'stroke-width':'1px'});
		}
	}

	// max.apply with 0 length array will generate -inf value, then check if measure_heights has at least one element
	if( measure_heights.length > 0 )
		y_base += Math.max.apply(null, measure_heights);

	return {y_base:y_base};
}

function getGlobalMacros(track)
{
	var global_macros = {};

	global_macros.title = "NO TITLE";
	if( "TITLE" in track.macros ){
		global_macros.title = track.macros["TITLE"];
	}

	global_macros.artist = "NO ARTIST";
	if( "ARTIST" in track.macros ){
		global_macros.artist = track.macros["ARTIST"];
	}

	global_macros.sub_title = "";
	if( "SUB_TITLE" in track.macros ){
		global_macros.sub_title = track.macros["SUB_TITLE"];
	}

	global_macros.x_global_scale = 1.0;
	if( "XSCALE" in track.macros ){
		global_macros.x_global_scale = parseFloat(track.macros["XSCALE"]);
	}

	global_macros.transpose = 0;
	if( "TRANSPOSE" in track.macros)
	{
		var t = parseInt(track.macros["TRANSPOSE"]);
		if(!isNaN(t))
			global_macros.transpose = t;
	}

	global_macros.half_type = "GUESS";
	if( "HALF_TYPE" in track.macros)
	{
		global_macros.half_type = track.macros["HALF_TYPE"]; // "SHARP","FLAT","GUESS"
	}

	global_macros.staff = "AUTO";
	if( "STAFF" in track.macros)
	{
		global_macros.staff = track.macros["STAFF"];
	}

	global_macros.row_margin = null;
	if( "ROW_MARGIN" in track.macros)
	{
		global_macros.row_margin = parseInt(track.macros["ROW_MARGIN"]);
	}

	global_macros.theme = "Default";
	if( "THEME" in track.macros)
	{
		global_macros.theme = track.macros["THEME"];
	}

	global_macros.reharsal_mark_position = "Default";
	if( "REHARSAL_MARK" in track.macros)
	{
		global_macros.reharsal_mark_position = track.macros["REHARSAL_MARK"];

		if(global_macros.reharsal_mark_position == "Inner" && global_macros.staff != "ON"){
			alert("REHARSAL_MARK=\"Inner\" needs to be specified with STAFF=\"ON\"");
		}
	}

	return global_macros;
}

// Compare global macros and rehearsal group macros.
// If rehearsal group macro is defined it is adopted.
function getMacros(global_macros, rg)
{
	var macros_to_apply = $.extend(true, {}, global_macros); // Deep copy

	if( "XSCALE" in rg.macros ){
		macros_to_apply.x_global_scale = parseFloat(rg.macros["XSCALE"]);
	}

	if( "TRANSPOSE" in rg.macros)
	{
		var t = parseInt(rg.macros["TRANSPOSE"]);
		if(!isNaN(t))
			macros_to_apply.transpose = t;
	}

	if( "HALF_TYPE" in rg.macros)
	{
		macros_to_apply.half_type = rg.macros["HALF_TYPE"]; // "SHARP","FLAT","GUESS"
	}

	if( "STAFF" in rg.macros)
	{
		macros_to_apply.staff = rg.macros["STAFF"];
	}

	return macros_to_apply;
}

function makeDammyPaper()
{
	$("body").append("<div id='invisible_view2'></div>");
	$("#invisible_view2").css({opacity:0.2, position:"absolute",top:0, left:0});
	paper = Raphael($("#invisible_view2")[0],1,1);
	return paper;
}

function removeDammyPaper()
{
	$("#invisible_view2").remove();
}

function Initialize()
{
	// Pre-load web-fonts because BBox of the fonts can not be correctly retrieved
	// for the first-rendered fonts. This may be a browser bug ?
	var paper = makeDammyPaper();
	var FONT_FAMILIES=["realbook_music_symbol","Arial"]; // List all the fonts used
	for(var i=0; i < FONT_FAMILIES.length; ++i){
		var text = raphaelText(paper, 100, 100, "ABCDEFG#b123456789dsMm", 16, "lt",FONT_FAMILIES[i]);
	}
	raphaelText(paper, 100, 120, "b#\ue700\ue701\ue702\ue710\ue711\ue901", 16, "lt",'smart_music_symbol');
	removeDammyPaper();
}

function render_impl(canvas, track, just_to_estimate_size, param, async_mode, progress_cb)
{
	var draw = !just_to_estimate_size;

	console.log("render_impl called with " + draw);

	var y_title_offset = param.y_title_offset;
	var x_offset = param.x_offset;
	var width = param.paper_width - x_offset * 2;
	var paper = null;
	if(draw){
		paper = makeNewPaper(canvas, param);
	}else{
		// Dammy paper object
		paper = makeDammyPaper();
	}

	var y_base = param.y_first_page_offset;

	var songname = "";

	var global_macros = getGlobalMacros(track);

	// Title
	if(draw) raphaelText(paper, x_offset + width/2, y_title_offset, global_macros.title, 24, "ct");
	songname = global_macros.title;

	// Sub Title
	if(draw && global_macros.sub_title != "")
		raphaelText(paper, x_offset + width/2, y_title_offset + 28, global_macros.sub_title, 14, "ct");

	// Artist
	if(draw) raphaelText(paper, x_offset + width, param.y_author_offset, global_macros.artist, 14, "rt");
	songname += ("/"+global_macros.artist);

	// Apply for rendering parameter if specified by global macros
	if (global_macros.row_margin !== null)
		param.row_margin = global_macros.row_margin;

	/* Paging */
	console.log("render_impl called with " + draw + " : Making pagination");

	var pageslist = [];
	if(draw){

		var y_stacks = [{type:'titles',height:param.y_first_page_offset}];
		for(var i = 0; i < track.reharsal_groups.length; ++i)
		{
			var rg_macros = getMacros(global_macros, track.reharsal_groups[i]);
			console.group("Macro for " + track.reharsal_groups[i].name);
			console.log(rg_macros);
			console.groupEnd();
			y_stacks.push({type:'reharsal',height:param.rm_area_height,cont:track.reharsal_groups[i],macros:rg_macros});
			var rg = track.reharsal_groups[i];
			for(var bi = 0; bi < rg.blocks.length; ++bi){
				var block_measures = rg.blocks[bi];
				var row_max_height = 0;
				var meas_row = [];
				var pm = null;
				var row_id_in_block = 0;
				for(var ml = 0; ml < block_measures.length; ++ml){
					var m = block_measures[ml];
					if(m.new_line){
						y_stacks.push({type:'meas', height:row_max_height,cont:meas_row,
							nm:m,pm:pm,rg:track.reharsal_groups[i],macros:rg_macros,
							block_id:bi,row_id_in_block:row_id_in_block});
						row_max_height = 0;
						meas_row = [];
						pm = ml>0?block_measures[ml-1]:null;
						row_id_in_block += 1;
					}
					meas_row.push(m);
					row_max_height = Math.max(row_max_height, m.renderprop.meas_height);
				}
				if(row_max_height > 0)
					y_stacks.push({type:'meas', height:row_max_height,cont:meas_row,
						nm:null,pm:pm,rg:track.reharsal_groups[i],macros:rg_macros,
						block_id:bi,row_id_in_block:row_id_in_block});
			}
		}

		var sum_y = 0;
		var page_cont = [];
		for(var i = 0; i < y_stacks.length; ++i)
		{
			if(sum_y + y_stacks[i].height <= (param.paper_height - param.y_offset)){
				sum_y += y_stacks[i].height;
				page_cont.push(y_stacks[i]);
			}else{
				pageslist.push(page_cont);
				page_cont = [y_stacks[i]];
				sum_y = y_stacks[i].height;
			}
		}
		if(page_cont.length > 0)
			pageslist.push(page_cont);

		console.log("////////");
		console.log(pageslist);
	}else{
		// Screening stage : all the contents are put in the single page
		var y_stacks = [{type:'titles',height:x_offset}];
		for(var i = 0; i < track.reharsal_groups.length; ++i)
		{
			var rg_macros = getMacros(global_macros, track.reharsal_groups[i]);
			y_stacks.push({type:'reharsal',height:param.rm_area_height,cont:track.reharsal_groups[i],macros:rg_macros});
			var rg = track.reharsal_groups[i];
			for(var bi = 0; bi < rg.blocks.length; ++bi){
				y_stacks.push({type:'meas',height:0,cont:rg.blocks[bi],
					nm:null,pm:null,rg:track.reharsal_groups[i],macros:rg_macros,
					block_id:bi,row_id_in_block:0});
			}
		}
		pageslist.push(y_stacks);
	}

	/* Paging */
	console.log("render_impl called with " + draw + " : Invoke async loop execution");

	/* If reharsal group is drawn left side of the measures, calculte the offset */
	if(!draw){
		track.pre_render_info["meas_left_offset"] = 0;
	}

	if(async_mode){
		Task.Foreach(pageslist, function(pageidx, len, page, ctx1){

			Task.Foreach(page, function(pei,yselen, yse, ctx2){

				if(progress_cb){
					progress_cb((ctx2.draw ? "":"Pre-")+"Rendering block " + pei + " in page " + (pageidx+1) + " of " + songname);
				}

				if(yse.type == 'titles'){

				}else if(yse.type == 'reharsal' && yse.macros.reharsal_mark_position != "Inner"){
					var rg = yse.cont;

					if(ctx2.draw){
						var g = raphaelTextWithBox(ctx2.paper, x_offset, ctx2.y_base, rg.name, ctx2.param.reharsal_mark_font_size);
					}

					ctx2.y_base += ctx2.param.rm_area_height; // Reharsal mark area height

				}else if(yse.type == 'meas'){
					var row_elements_list = yse.cont;
					var r = render_measure_row(
							x_offset + track.pre_render_info["meas_left_offset"],
							ctx2.paper, yse.macros.x_global_scale, yse.macros.transpose,
							yse.macros.half_type, row_elements_list, yse.rg, yse.pm, yse.nm,
							ctx2.y_base, ctx2.param, ctx2.draw,
							yse.macros.staff, global_macros.theme,
							(yse.block_id==0 && yse.row_id_in_block==0),
							yse.macros.reharsal_mark_position=="Inner");
					ctx2.y_base = r.y_base;
				}

			}, ctx1, "renderpageelemloop");

			var lasttask = Task.enqueueFunctionCall(function(){
				// Page number footer
				footerstr = (songname + " - " + (pageidx+1) + " of " + (pageslist.length));
				//alert(footerstr);
				raphaelText(ctx1.paper, param.paper_width/2, param.paper_height - 60, footerstr, 12, "ct");

				// Make new page
				if(ctx1.draw && pageidx != pageslist.length-1){
					ctx1.paper = makeNewPaper(canvas, ctx1.param);
					ctx1.y_base = ctx1.param.y_offset;
				}}, [], "renderpageelemloop");

			return lasttask;

		},{param:param,draw:draw,paper:paper,y_base:y_base}, "renderpageloop");

		var task = Task.enqueueFunctionCall(function(){
			if(!draw){
				removeDammyPaper();
			}
		}, [], "renderpageloop");

		return task;

	}else{

		for(var pageidx = 0; pageidx < pageslist.length; ++pageidx){

			var yse = pageslist[pageidx];
			for(var pei = 0; pei < yse.length; ++pei){ // Loop each y_stacks
				if(yse[pei].type == 'titles'){

				}else if(yse[pei].type == 'reharsal' && yse[pei].macros.reharsal_mark_position != "Inner"){
					var rg = yse[pei].cont;

					if(draw){
						var g = raphaelTextWithBox(paper, x_offset, y_base, rg.name, param.reharsal_mark_font_size);
					}

					y_base += param.rm_area_height; // Reharsal mark area height
				}else if(yse[pei].type == 'meas'){
					var row_elements_list = yse[pei].cont;
					var r = render_measure_row(
							x_offset + track.pre_render_info["meas_left_offset"],
							paper, yse[pei].macros.x_global_scale, yse[pei].macros.transpose,
							yse[pei].macros.half_type, row_elements_list,
							yse[pei].rg, yse[pei].pm, yse[pei].nm,
							y_base, param, draw, yse[pei].macros.staff, global_macros.theme,
							(yse[pei].block_id==0 && yse[pei].row_id_in_block==0),
							yse[pei].macros.reharsal_mark_position == "Inner");
					y_base = r.y_base;
				}
			}
			// Page number footer
			footerstr = (songname + " - " + (pageidx+1) + " of " + (pageslist.length));
			//alert(footerstr);
			raphaelText(paper, param.paper_width/2, param.paper_height - 60, footerstr, 12, "ct");

			if(draw && pageidx != pageslist.length-1){
				paper = makeNewPaper(canvas, param);
				y_base = param.y_offset;
			}
		} // reharsal group loop


		if(!draw){
			removeDammyPaper();
		}

	} // end async switch
}

function draw_segno(paper, x, y, segno)
{
	var rsr = paper; //Raphael('rsr', '708.53131', '776.59619');
	var path3001 = rsr.path("m 7.45119,0.00462507 c -2.62006,-0.12965 -4.89531,2.48917003 -4.5203,5.06077003 0.30852,2.3265 2.16735,4.12974 4.20376,5.1011599 1.65879,0.86938 3.71404,0.71264 5.22694,1.90481 1.39044,1.02552 1.92776,3.15917 0.89399,4.61515 -0.59006,0.8633 -1.60565,1.57525 -2.69669,1.40546 -0.51026,-0.79781 -0.0548,-1.84761 -0.5841,-2.65244 -0.50017,-0.97685 -1.7314,-1.52668 -2.77051,-1.09339 -1.09273,0.36861 -1.55201,1.78786 -0.96315,2.76184 0.95747,1.95409 3.44952,2.65453 5.45383,2.15374 2.52866,-0.60348 4.08162,-3.66205 3.0424,-6.05383 -0.87324,-2.27646 -3.05164,-3.8349199 -5.33435,-4.4943599 -1.63211,-0.39445 -3.53265,-0.67749 -4.56541,-2.16526 -0.96216,-1.25884 -0.91035,-3.20529 0.26205,-4.31632 0.58015,-0.61405 1.43392,-1.05559 2.29618,-0.91468 0.51027,0.79781 0.0548,1.84762 0.5841,2.65244 0.50017,0.97686 1.7314,1.52668 2.77051,1.09339 1.0378,-0.35178 1.53161,-1.67674 1.0195,-2.63799 C 11.07123,0.77410507 9.16303,-0.05833493 7.45119,0.00462507 z"); path3001.attr({id: 'path3001',"font-size": 'medium',"font-style": 'normal',"font-variant": 'normal',"font-weight": 'normal',"font-stretch": 'normal',"text-indent": '0',"text-align": 'start',"text-decoration": 'none',"line-height": 'normal',"letter-spacing": 'normal',"word-spacing": 'normal',"text-transform": 'none',direction: 'ltr',"block-progression": 'tb',"writing-mode": 'lr-tb',"text-anchor": 'start',"baseline-shift": 'baseline',color: '#000000',fill: '#000000',"fill-opacity": '1',stroke: 'none','stroke-width':'1','stroke-opacity':'1',"stroke-width": '50',marker: 'none',visibility: 'visible',display: 'inline',overflow: 'visible',"enable-background": 'accumulate',"font-family": 'Sans',"-inkscape-font-specification": 'Sans'}).data('id', 'path3001'); var path3807 = rsr.path("m 15.97079,8.1489251 c 0.005,0.3706 -0.23305,0.72802 -0.57561,0.8684 -0.33653,0.14657 -0.75456,0.0707 -1.01709,-0.18618 -0.26603,-0.24718 -0.3631,-0.65442 -0.23893,-0.99541 0.12006,-0.35345 0.46727,-0.61404 0.84067,-0.62804 0.36299,-0.0235 0.72582,0.18693 0.88786,0.51217 0.0679,0.13213 0.10333,0.28054 0.1031,0.42906 z"); path3807.attr({id: 'path3807',fill: '#000000',stroke: '#000000',"stroke-width": '0',"stroke-linecap": 'round',"stroke-miterlimit": '4',"stroke-opacity": '1',"stroke-dasharray": 'none'}).data('id', 'path3807'); var path3822 = rsr.path("m 3.38842,11.049785 c 0.005,0.3706 -0.23305,0.72802 -0.57561,0.8684 -0.33653,0.14657 -0.75456,0.0707 -1.01709,-0.18618 -0.26603,-0.24718 -0.3631,-0.65442 -0.23893,-0.99541 0.12006,-0.35345 0.46727,-0.61404 0.84067,-0.62804 0.36299,-0.0235 0.72582,0.18693 0.88786,0.51217 0.0679,0.13213 0.10333,0.28054 0.1031,0.42906 z"); path3822.attr({id: 'path3822',fill: '#000000',stroke: '#000000',"stroke-width": '0',"stroke-linecap": 'round',"stroke-miterlimit": '4',"stroke-opacity": '1',"stroke-dasharray": 'none'}).data('id', 'path3822'); var path3803 = rsr.path("M 15.69138,2.8164551 C 10.46092,7.2657851 5.23046,11.715125 0,16.164455 c 0.68845,-0.002 1.37691,-0.003 2.06536,-0.005 5.21598,-4.44988 10.43195,-8.8997599 15.64793,-13.3496399 -0.67397,0.002 -1.34794,0.004 -2.02191,0.007 z"); path3803.attr({id: 'path3803',"font-size": 'medium',"font-style": 'normal',"font-variant": 'normal',"font-weight": 'normal',"font-stretch": 'normal',"text-indent": '0',"text-align": 'start',"text-decoration": 'none',"line-height": 'normal',"letter-spacing": 'normal',"word-spacing": 'normal',"text-transform": 'none',direction: 'ltr',"block-progression": 'tb',"writing-mode": 'lr-tb',"text-anchor": 'start',"baseline-shift": 'baseline',color: '#000000',fill: '#000000',"fill-opacity": '1',stroke: 'none','stroke-width':'1','stroke-opacity':'1',"stroke-width": '49.9',marker: 'none',visibility: 'visible',display: 'inline',overflow: 'visible',"enable-background": 'accumulate',"font-family": 'Sans',"-inkscape-font-specification": 'Sans'}).data('id', 'path3803'); var rsrGroups = [];
	// Need to note raphael set is not g tag in svg element. Then need to make 2 groups here to apply different tranform.
	var group1 = rsr.set();

	group1.push(path3001, path3807, path3822, path3803);
	group1.transform("t"+x +","+(y-1)+" s0.9");

	var h = group1.getBBox().height;

	var group2 = rsr.set();
	var group2_valid = false;
	if(segno.number !== null){
		group2.push( raphaelText(paper, group1.getBBox().width, h + 5, segno.number, 20, "lb"));
		group2_valid = true;
	}

	if(segno.opt !== null){
		group2.push( raphaelText(paper, group1.getBBox().width + (group2_valid ? group2.getBBox().width : 0), h + 3, "("+segno.opt+")", 16, "lb"));
		group2_valid = true;
	}
	// Empty set in the super set will return invalid getBBox(), then need to judge if group2 is valid set ... X(
	if(group2_valid){
		group2.transform("t"+x +","+(y-1));
		return rsr.set([group1,group2]);
	}else{
		return group1;
	}
}

function draw_coda(paper, x, y, align, coda)
{
	// aligh=(l|c|r)(b|m|t)
	var rsr = paper; //Raphael('rsr', '708.53131', '776.59619');
	var path3878 = rsr.path("m 7.36,1.9518304 c -3.1472,0 -5.51238,3.23098 -5.51238,6.97709 0,3.7461196 2.36518,6.9770896 5.51238,6.9770896 3.1472,0 5.51238,-3.23097 5.51238,-6.9770896 0,-3.74611 -2.36518,-6.97709 -5.51238,-6.97709 z m 0,0.84817 c 1.97338,0 3.75892,3.18901 3.75892,6.12892 0,2.9399196 -1.78554,6.1289296 -3.75892,6.1289296 -1.97338,0 -3.75892,-3.18901 -3.75892,-6.1289296 0,-2.93991 1.78554,-6.12892 3.75892,-6.12892 z"); path3878.attr({id: 'path3878',"font-size": 'medium',"font-style": 'normal',"font-variant": 'normal',"font-weight": 'normal',"font-stretch": 'normal',"text-indent": '0',"text-align": 'start',"text-decoration": 'none',"line-height": 'normal',"letter-spacing": 'normal',"word-spacing": 'normal',"text-transform": 'none',direction: 'ltr',"block-progression": 'tb',"writing-mode": 'lr-tb',"text-anchor": 'start',"baseline-shift": 'baseline',color: '#000000',fill: '#000000',"fill-opacity": '1',stroke: 'none','stroke-width':'1','stroke-opacity':'1',"stroke-width": '72.4',marker: 'none',visibility: 'visible',display: 'inline',overflow: 'visible',"enable-background": 'accumulate',"font-family": 'Sans',"-inkscape-font-specification": 'Sans'}).data('id', 'path3878'); var path4413 = rsr.path("m 7.2,3.814697e-7 -3.6,0 0,0.7999999985303 3.2,0.40000002 0,7.6 1.2,0 0,-7.6 3.2,-0.40000002 0,-0.7999999985303 z"); path4413.attr({id: 'path4413',fill: '#000000',stroke: 'none','stroke-width':'1','stroke-opacity':'1'}).data('id', 'path4413'); var path4415 = rsr.path("m 7.6,17.6 3.6,0 0,-0.8 -3.2,-0.4 0,-7.5999996 -1.2,0 0,7.5999996 -3.2,0.4 0,0.8 z"); path4415.attr({id: 'path4415',fill: '#000000',stroke: 'none','stroke-width':'1','stroke-opacity':'1'}).data('id', 'path4415'); var path4417 = rsr.path("m 14.8,8.8000004 0,-3.6 -0.8,0 -0.4,3.2 -7.6,0 0,1.2 7.6,0 L 14,12.8 l 0.8,0 z"); path4417.attr({id: 'path4417',fill: '#000000',stroke: 'none','stroke-width':'1','stroke-opacity':'1'}).data('id', 'path4417'); var path4419 = rsr.path("M 0,9.2000004 0,12.8 l 0.8,0 0.4,-3.1999996 7.6,0 0,-1.2 -7.6,0 -0.4,-3.2 -0.8,0 z"); path4419.attr({id: 'path4419',fill: '#000000',stroke: 'none','stroke-width':'1','stroke-opacity':'1'}).data('id', 'path4419'); var rsrGroups = [];
	var group = rsr.set();
	group.push(path3878, path4413, path4415, path4417, path4419);
	if(coda.number !== null)
		group.push( raphaelText(paper, group.getBBox().width, group.getBBox().height + 4, coda.number, 20, "lb"));

	if(align !== undefined && align !== null){
		//console.log(group.getBBox());
		var xc = align[0]=='l'?0.0:(align[0]=='c'?0.5:1.0);
		x -= xc * group.getBBox().width ;
		var yc = align[1]=='t'?0.0:(align[1]=='m'?0.5:1.0);
		y -= yc * group.getBBox().height;
	}
	group.transform("t"+x+","+(y));
	return group;
}


return {
	Parser: Parser,
	Renderer: Renderer,
	Sequencer: Sequencer,
	Initialize: Initialize
}

})();
