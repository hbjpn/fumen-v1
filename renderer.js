
var pages = new Array();

var RENDERING_RULE_BOUNDARY = new Array();

var g_async_mode = false;


function render(canvas, paper_width, paper_height, track, progress_cb)
{
	var param = {
		row_interval : 70,
		y_title_offset : 50,
		y_author_offset : 90,
		y_first_page_offset : 120,
		y_offset : 70,
		x_offset : 70,
		min_measure_width : 100,
		row_height : 24,
		row_margin : 25,
		rs_area_height : 24, // Rhythm Slashes Area
		rm_area_height : 30, // Reharsal Mark Area
		mh_area_height : 25, // Measure Header Area ( Repeat signs area )
		max_scaling : 1.2,
		paper_width : paper_width,
		paper_height : paper_height,
		repeat_mark_font : {'font-family':'Times New Roman','font-style':'italic','font-weight':'bold'},
	};
	
	if(g_async_mode){
		clearPapers(canvas);
		Task.enqueueFunctionCall(render_impl, [canvas, track, true, param, progress_cb], "render");
		Task.enqueueFunctionCall(identify_scaling, [track, param], "render");
		var task = Task.enqueueFunctionCall(render_impl, [canvas, track, false, param, progress_cb], "render");
		return task;
	}else{
		render_impl(canvas, track, true, param, progress_cb);
		// Esiate scaling factor
		identify_scaling(track, param);
		render_impl(canvas, track, false, param, progress_cb);
	}
}

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
			}
		}
		
	}
	
	return {header:header_elements, body:body_elements, footer:footer_elements, measure_wide:measure_wide_elements};
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

function identify_scaling(track, param)
{
	console.log("Identify scaling called");
	var width = param.paper_width - param.x_offset * 2;
	
	for(var i = 0; i < track.reharsal_groups.length; ++i)
	{
		var rg = track.reharsal_groups[i];

		var currentSumWidth = 0;
		
		var rows = new Array();
		var row_measures = new Array();
		
		var vertical_align = true;
		var force_even_measures_per_line = true;
		if(vertical_align){
			// Estimate optimized TR line-break point
			// Decide where to insert line-break
			var maxC = 0;
			for(var ml = 0; ml < rg.measures.length; ++ml){
				maxC = ml+1;
				var m = rg.measures[ml];		
				currentSumWidth += (m.header_width + m.body_width + m.footer_width);
				//console.log(m.header_width + "/" + m.body_width + "/" + m.footer_width + ":" + currentSumWidth + " vs " + width);			
				if(currentSumWidth > width){ maxC--; break; }
			}
			
			//console.log("maxC = " + maxC);
			var N = rg.measures.length;
			var C = maxC;
			var meas_max_widths = new Array();
			var Q_w_for_C = 0;
			for(; C > 0; --C){
				for(var c = 0; c < C; ++c){			
					var max_w_for_c = maxtor(rg.measures, function(r){ return r*C+c; }, function(m){ return m.header_width + m.body_width + m.footer_width;});
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

			var reharsal_wide_scaling = width / Q_w_for_C; 
			for(var ml = 0; ml < rg.measures.length; ++ml){
				var m = rg.measures[ml];
				var row = Math.floor(ml / C);
				var col = ml - row * C;
				var new_body_width = meas_max_widths[col] * reharsal_wide_scaling - (m.header_width + m.footer_width);
				m.new_line = ( col == 0 && row > 0 );
				m.body_scaling = new_body_width / m.body_width; 
			}
			
		}else{
			// Decide where to insert line-break
			for(var ml = 0; ml < rg.measures.length; ++ml){
				var m = rg.measures[ml];
				
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

function clearPapers(canvas)
{
	for(var i = 0; i < pages.length; ++i){
		pages[i].clear();
	}
	$(canvas).children().remove();
	pages = new Array();
}

function makeNewPaper(canvas, param)
{
	var page_id = pages.length;
	$(canvas).append("<div id='page"+page_id+"'></div>"); // paper_div is jQuery object
	var paper_div=$(canvas).children("#page"+page_id)[0];
	paper = Raphael(paper_div, param.paper_width, param.paper_height);
	pages.push(paper);
	paper.canvas.style.backgroundColor = '#FFFFFF';
	
	// Logo:)
	raphaelText(paper, param.paper_width/2, param.paper_height - 40, "Lead sheet generated on http://shareleadsheet.com", 12, "ct");
	
	// Clear buffers
	ChordRenderBuffer = {};
	
	return paper;
}

function incrementY(y_base, canvas, paper, page_count, param, draw)
{
	var multi_paper_mode = true;
	if(multi_paper_mode){
		if(y_base + 2 * param.row_interval < (param.paper_height - param.y_offset) ){
			y_base = y_base + param.row_interval;
		}else{
			page_count++;
			// Multi paper mode
			// <svg> tag is seprated for each paper.
			y_base = param.y_offset;
			if(draw) paper = makeNewPaper(canvas, param);
		}	
	}else{
		// Single paper mode
		// All the svg elements are draw to single <svg> tag.
		if((y_base - page_count * param.paper_height) + 2 * param.row_interval < (param.paper_height - param.y_offset) ){
			y_base = y_base + param.row_interval;
		}else{
			page_count++; 
			y_base = page_count * param.paper_height + param.y_offset;
		}
	}
	
	return {y_base:y_base, page_count:page_count, paper:paper};
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
		if(e0.times !== null && e0.times != 2){
			if(draw) text = raphaelText(paper, x, y_body_base + row_height + 8, "(x" + e0.times+")", 13, "rc");
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
		if(e0.times !== null && e0.times != 2){
			if(draw) text = raphaelText(paper, x, y_body_base + row_height + 8, "(x" + e0.times+")", 13, "rc");
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

	var csi = chord.getChordStr(transpose, half_type);
	
	var text = raphaelText(paper, x, y_body_base + row_height/2, csi[1], 16, "lc", (csi[0]?"icomoon":null));
	//text.attr({'font-family':'icomoon'});
	x += text.getBBox().width * x_global_scale * body_scaling;
	x += (chord_space*body_scaling);
	if(!draw) text.remove();
	
	return {x:x};
}

var ChordRenderBuffer = {
		
};

/**
 * Chord rendering profile
 */
var _3rd_global_dy = 0;
var _3rd_font_profile = {
	'M'   : function(p){return [[16,-7,'M']];},
	'm'   : function(p){return [[16,-7,'m']];}
};
var _6791113_global_dy = 0;
var _6791113_font_profile = {
	'dim' : function(p){return [[16,-7,"d"]];},
	'sus' : function(p){return [[18,-9,"s"],[13,-2,p?p:""]];},
	'M'   : function(p){return [[16,-7,"M"],[13,-2,p?p:""]];},
	'm'   : function(p){return [[16,-7,"m"]];},
	'add' : function(p){return [[20,-10,"a"],[13,-2,p?p:""]];},
	'dig' : function(p){return [[13,-2,p?p:""]];}
};
var _5th_global_dy = 0;
var _5th_font_profile = {
	'#'   : function(p){return [[13,-2,'+'],[13,-2,p]];},
    'b'   : function(p){return [[13,-2,'-'],[13,-2,p]];},
    'dig' : function(p){return [[13,-2,p]];}
};
var _altered_global_dy = 0;
var _altered_font_profile = {
	'#'   : function(p){return [[13,-2,'#'],[13,-2,p]];},
    'b'   : function(p){return [[13,-2,'b'],[13,-2,p]];},
    'alt' : function(p){return [[13,-2,'alt']];}
};

function render_chord(chord, transpose, half_type, paper, x, y_body_base,
		param, draw, chord_space, x_global_scale, body_scaling)
{	
	var fontfamily = "icomoon";
	
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
	//var csi = e.getChordStr(transpose, half_type);
	var group = paper.set();

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
	
	if(bases[0]){
		text = raphaelText(paper, xl, y_body_base + row_height/2, bases[0], 18, "lc", fontfamily);
		group.push(text);
		xl += text.getBBox().width;
	}
	
	var wb3 = 0;
	if(_3rdelem.length > 0){
		var rp = _3rd_font_profile[_3rdelem[0].type](_3rdelem[0].param);
		var tx = 0;
		for(var i = 0; i < rp.length; ++i){
			text = raphaelText(paper, xl + tx,
					y_body_base + row_height/2 + rp[i][1] + _3rd_global_dy,
					rp[i][2], rp[i][0], "lt", fontfamily);
			group.push(text);
			tx += text.getBBox().width;
		}
		wb3 = tx;
	}
	var wbupper = 0;
	
	if(_5thelem.length > 0){
		var rp = _5th_font_profile[_5thelem[0].type](_5thelem[0].param);
		var tx = 0;
		for(var i = 0; i < rp.length; ++i){
			text = raphaelText(paper, xl + tx,
					y_body_base + row_height/2 + rp[i][1] + _5th_global_dy,
					rp[i][2], rp[i][0], "lb", fontfamily);
			group.push(text);
			tx += text.getBBox().width;
		}
		wbupper = tx;
	}
	
	var wblower = wb3;
	if(_6791113suselem.length > 0){
		var tx = 0;
		for(var n = 0; n < _6791113suselem.length; ++n){
			var rp= _6791113_font_profile[_6791113suselem[n].type](_6791113suselem[n].param);
			for(var i = 0; i < rp.length; ++i){
				if(rp[i][2] == "") continue;
				text = raphaelText(paper,
						xl + wb3 + tx,
						y_body_base + row_height/2 + rp[i][1] + _6791113_global_dy,
						rp[i][2], rp[i][0], "lt", fontfamily);
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
	var brace_margin = 5;
	for(var i = 0; i < _alteredelem.length; ++i){
		var e = _alteredelem[i];
		var rp = _altered_font_profile[e.type](e.param);
		var tw = 0, th = 0;
		for(var k = 0; k < rp.length; ++k){
			a_min_y = Math.min(a_min_y, y_body_base + ah + rp[k][1] + _altered_global_dy);
			text = raphaelText(paper,
					xl + brace_margin + tw,
					y_body_base + ah + rp[k][1] + _altered_global_dy,
					rp[k][2], rp[k][0], "lt", fontfamily);
			group.push(text);
			tw += text.getBBox().width;
			th = Math.max(th, text.getBBox().height);
		}
		ah += (th+1);
		aw = Math.max(aw, tw);
	}
	if(_alteredelem.length > 0){
		var brace_points_l = [[xl + brace_margin, a_min_y], [xl, a_min_y], [xl, a_min_y+ah], [xl + brace_margin, a_min_y+ah]];
		var bl = paper.path(svgArcBezie(brace_points_l)).attr('stroke-width','1px');
		
		var brace_points_r = [[xl + brace_margin+aw, a_min_y], [xl+brace_margin+aw+5, a_min_y], [xl+brace_margin+aw+5, a_min_y+ah], [xl+brace_margin+aw, a_min_y+ah]];
		var br = paper.path(svgArcBezie(brace_points_r)).attr('stroke-width','1px');
		
		group.push(bl);
		group.push(br);
		
		aw += brace_margin * 2;
	}
	
	xl += aw;
	if(bases[1])
	{
		text = raphaelText(paper, xl, y_body_base + row_height/2, "/", 26, "lc");
		group.push(text);
		xl += text.getBBox().width;
		text = raphaelText(paper, xl, y_body_base + row_height/2, bases[1], 18, "lc", fontfamily);
		group.push(text);
		xl += text.getBBox().width;
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

var rs_prev_coord = null;
var rs_prev_has_tie = false;
var rs_prev_tie_paper = null;

function render_empty_rythm_slash(paper, x_body_base, y_body_base, body_width, numslash, param, body_scaling)
{
	var rs_y_base = y_body_base + param.row_height + 10;
	var group = paper.set();
	for(var r = 0; r < numslash; ++r){
		var x = x_body_base + body_width / 4.0 * r;
		raphaelSlash(paper, group, x, rs_y_base, '0', 0);
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

function draw_balken(paper, group, balken, rs_y_base, barlen, flagintv, balken_width)
{
	if(balken.groups.length >= 2){
		var ps = balken.groups[0].coord;
		var pe = balken.groups[balken.groups.length-1].coord;
		var b = paper.path(svgLine(ps[0],ps[1],pe[0],pe[1])).attr({'stroke-width':balken_width});
		group.push(b);
		
		// Draw flag for balken
		var gg = to_same_value_group(balken.groups, function(o){return o.onka;});
		for(var g = 0; g < gg.length; ++g){
			var same_sds = gg[g];
			var sd = same_sds[0].onka;
			var numflag = myLog2(parseInt(sd)) - 2;
			
			if(same_sds.length == 1)
			{
				var pss = same_sds[0].coord;
				
				// Determine which direction to draw flag. Determined from which neighboring 
				// rhythm is more natural to coupling with.
				// Currently, simple strategy is adopted for now.
				var dir = 1;
				if(g == gg.length - 1) dir = -1;
				var neighbor_x = gg[g + dir][ gg[g+dir].length - 1 ].coord[0];
				var blen = Math.abs(neighbor_x - pss[0]) * 0.3;
				
				for(var fi = 0; fi < numflag; ++fi)
				{
					o = paper.path(svgLine(pss[0], rs_y_base+barlen-fi*flagintv, pss[0] + dir * blen, rs_y_base+barlen-fi*flagintv)).attr({'stroke-width':balken_width});
					group.push(o);
				}
			}else if(same_sds.length >= 2){
				var pss = same_sds[0].coord;
				var pse = same_sds[same_sds.length-1].coord;
				for(var fi = 0; fi < numflag; ++fi)
				{
					o = paper.path(svgLine(pss[0],pss[1]-fi*flagintv,pse[0],pse[1]-fi*flagintv)).attr({'stroke-width':balken_width});
					group.push(o);
				}
			}
		}
	}else if(balken.groups.length == 1){
		// Normal drawing of flags
		var ps = balken.groups[0].coord;
		var sd = balken.groups[0].onka;
		var numflag = myLog2(parseInt(sd)) - 2;
		for(var fi = 0; fi < numflag; ++fi)
		{
			o = paper.path("M"+(ps[0]+10)+","+(rs_y_base+barlen-10-fi*flagintv) + "L"+(ps[0])+","+(rs_y_base+barlen-fi*flagintv)).attr({'stroke-width':'1px'});
			group.push(o);
		}
	}
}

function render_rhythm_slash(elems, paper, y_body_base, meas_start_x, meas_end_x, param,
		draw, chord_space, body_scaling, all_has_length)
{
	var rs_y_base = y_body_base + param.row_height + 10;
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
		var x = e.renderprop.x;
		var barlen = 20;
		var flagintv = 5;
		if(e.length_s === null || e.length_s === undefined)
			continue;

		var d = e.length_s.match(/[0-9]+/)[0];
		var dots = e.length_s.substr(d.length);
		
		if(e instanceof Chord){
			drawn = true;

			if(d == '0' || d == '1'){
				raphaelSlash(paper, group, x, rs_y_base, d, dots.length);			
			}else{
				raphaelSlash(paper, group, x, rs_y_base, d, dots.length);
				var o = paper.path("M"+x+","+rs_y_base + "L"+x+","+(rs_y_base+barlen)).attr({'stroke-width':'1px'});
				group.push(o);
			}
		}
		
		if(all_has_length){
			var is_boundary = 
				e.length >= WHOLE_NOTE_LENGTH/4 ||
				(balken.sum_len % (WHOLE_NOTE_LENGTH/4) == 0);
			if(is_boundary){
				draw_balken(paper, group, balken, rs_y_base, barlen, flagintv, balken_width);
				balken.groups = [];
			}
			balken.sum_len += e.length;
			if(e.length < WHOLE_NOTE_LENGTH/4 && e instanceof Chord){
				balken.groups.push({
					coord : [e.renderprop.x, rs_y_base + barlen],
					onka : d
				});
			}
			// If this is the last of loop, draw balken for remaining balken group
			if(ei == elems.length-1){
				draw_balken(paper, group, balken, rs_y_base, barlen, flagintv, balken_width);
			}
		}
			
		if(e instanceof Chord){
			if(rs_prev_has_tie){
				// Draw tie line
				var dy = -10;
				var sdx = 12;
				var round = 8;
				var ps = rs_prev_coord;
				var pe = [x, rs_y_base, meas_start_x, meas_end_x];
				if(ps[1] != pe[1]){
					// Crossing measure row. Previous RS mark could be on another page.
					// Make sure to create curve on the paper on which previous RS is drawn.
					var brace_points = [[ps[0] + sdx,ps[1]+dy], [ps[0] + sdx, ps[1]-round+dy], 
					                    [ps[3]+20, ps[1]-round+dy], [ps[3]+20,ps[1]+dy]];
					clip = (ps[0]+sdx) + "," + (ps[1]-50) + ","+(ps[3]-(ps[0]+sdx)+5)+",100";
					console.log("clip:"+clip);
					
					var bl = rs_prev_tie_paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px').attr({'clip-rect':clip});
					rs_prev_tie_paper.set().push(bl);
					
					brace_points = [[pe[2] - 20, pe[1]+dy], [pe[2] - 20, pe[1]-round+dy], 
					                    [pe[0], pe[1]-round+dy], [pe[0],pe[1]+dy]];
					clip = (pe[2]-5) + "," + (pe[1]-50) + ","+(pe[0]-(pe[2]-5))+",100";
					console.log("clip:"+clip);
					bl = paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px').attr({'clip-rect':clip});
					group.push(bl);			
				}else{
					var brace_points = [[ps[0] + sdx,ps[1]+dy], [ps[0] + sdx, ps[1]-round+dy],
					                    [pe[0], pe[1]-round+dy], [pe[0],pe[1]+dy]];
					var bl = paper.path(svgArcBezie(brace_points)).attr('stroke-width','2px');
					group.push(bl);
				}
				
			}
			rs_prev_has_tie = e.tie;
			rs_prev_coord = [x, rs_y_base, meas_start_x, meas_end_x];
			rs_prev_tie_paper = paper;
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

function render_measure_row(paper, x_global_scale, transpose, half_type,
		row_elements_list, prev_measure, next_measure, y_base, param, draw, staff)
{
	/* Reference reserved width for empty measures */
	var text = raphaelText(paper, 0, 0,"C7", 16, "lc", "icomoon");
	var C7_width = text.getBBox().width;
	text.remove();
	
	var rs_area_detected = false;
	var mh_area_detected = false;

	//var draw_5line = false;
	if(staff == "ON"){
		rs_area_detected = true;
	}
	
	// Screening of y-axis areas
	for(var ml = 0; ml < row_elements_list.length; ++ml){
		var m = row_elements_list[ml];
		for(var ei = 0; ei < m.elements.length; ++ei)
		{
			var e = m.elements[ei];
			if(e instanceof Coda || e instanceof Segno){
				mh_area_detected = true;
			}else if(e instanceof Chord){
				rs_area_detected |= (e.length_s !== null);
			}
		}
	}
	if(staff == "OFF"){
		rs_area_detected = false;
	}
	
	var d5y = rs_area_detected ? param.row_height + 5 : 0;
 	
	var subheader_height = mh_area_detected ? param.mh_area_height : 0;
	
	var y_body_base = y_base + subheader_height;
	
	var measure_heights = [];
	
	
	var first_meas_start_x = x;
	var last_meas_end_x = x;
	
	for(var ml = 0; ml < row_elements_list.length; ++ml){
		
		var m = row_elements_list[ml];
		
		var meas_base_x = x;   // Start of this measure including boundary
		var meas_start_x = x;  // Start of this measure excluding boundary
		var meas_end_x = x;    // End of this measure
		
		var elements = classifyElements(m);
		
		var meas_height = 0;
		
		// Draw sub header field ( Repeat signs )
		var m_mh_area_detected = false;
		for(var ei = 0; ei < elements.header.length; ++ei)
		{
			var e = elements.header[ei];
			if(e instanceof Coda){
				m_mh_area_detected = true;
				if(draw){
					draw_coda(paper, meas_base_x, y_base, "lt", e);
				}
			}else if(e instanceof Segno){
				m_mh_area_detected = true;
				if(draw){
					draw_segno(paper, meas_base_x, y_base + 3, e);
				}
			}
		}
		
		if(m_mh_area_detected){
			meas_height += param.mh_area_height;
		}
		
		// Draw header
		// Clef, Key, Begin Boundary, Time(1st one) are included in this area
		for(var ei = 0; ei < elements.header.length; ++ei)
		{
			var e = elements.header[ei];
			if(e instanceof MeasureBoundary)
			{
				var pm = ml == 0 ? prev_measure : row_elements_list[ml-1];
				var ne = pm ? pm.elements[ pm.elements.length - 1] : null;
				var r = draw_boundary('begin', ne, e, m.new_line, paper, x, y_body_base + d5y, param, draw);
				x = r.x;
				meas_start_x = r.bx;
			}else if(e instanceof Time){
				x += 4;
				var hlw = 0;
				var lx = x;
				var textn = raphaelText(paper, lx, y_body_base + d5y,                e.numer, 12, "lt", "icomoon");
				hlw = textn.getBBox().width;
				var textd = raphaelText(paper, lx, y_body_base + param.row_height/2 + d5y, e.denom, 12, "lt", "icomoon");
				hlw = Math.max(hlw, textd.getBBox().width);
				textn.attr({'x':textn.attr('x') + (hlw - textn.getBBox().width)/2});
				textd.attr({'x':textd.attr('x') + (hlw - textd.getBBox().width)/2});
				var ly = y_body_base + param.row_height/2;
				if(draw && (!rs_area_detected)) paper.path(svgLine(lx, ly, lx+hlw, ly)).attr({"stroke-width":"1"});
				//console.log("hlw = " + hlw);
				x += hlw;
			}
		}
		
		// Margin between header and body
		x += 10;
		
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
				all_has_length &= (e.length !== null);
				if(all_has_length) sum_length += e.length;
				chord_and_rests.push(e);
			}
		}
		
		var chord_name_str = null;
		
		for(var ei = 0; ei < elements.body.length; ++ei)
		{
			var e = elements.body[ei];

			var chord_space = 0;
			if(all_has_length)
				chord_space = Math.floor(40*x_global_scale / sum_length*e.length);
			else
				chord_space = Math.floor(40*x_global_scale / num_chord_in_a_measure);
			
			if(e instanceof Chord){
				if(false){
					var csi = e.getChordStr(transpose, half_type);
					
					var text = raphaelText(paper, x, y_body_base + param.row_height/2, csi[1], 16, "lc", (csi[0]?"icomoon":null));
					//text.attr({'font-family':'icomoon'});
					x += text.getBBox().width * m.body_scaling;
					x += (chord_space*m.body_scaling);
					if(!draw) text.remove();
				}else{
					var cr = render_chord(e, transpose, half_type, paper, x, y_body_base,
							param, draw, chord_space, x_global_scale, m.body_scaling);
					x = cr.x;
					if(!isFinite(x)){
						console.log("Illegal calculation of x is detected");
					}
					if(g_prev_chord_has_tie || (chord_name_str == e.chord_name_str)){
						cr.group.remove(); // Not draw chord symbol
					}
					g_prev_chord_has_tie = e.tie;
					chord_name_str = e.chord_name_str;
				}
			}else if(e instanceof Rest){
				var cmap = {1:'\ue600', 2: '\ue601', 4:'\ue602', 8:'\ue603', 16: '\ue603', 32:'\ue603'};
				var yoffsets = {1:0, 2:0, 4:0, 8:0, 16:7, 32:7, 64:14, 128:14};
				var rd = parseInt(e.length_s);
				var rg = paper.set();
				var oy = yoffsets[rd];
				var fs = 14;
				if(rd <= 4){
					var text = raphaelText(paper, x, y_body_base + param.row_height/2 + d5y, cmap[rd], fs, "lc", "icomoon");
					rg.push(text);
				}else{
					var nKasane = myLog2(rd) - 2;
					var rdx = 2;
					var rdy = -7;
					for(var k = 0; k < nKasane; ++k){
						var text = raphaelText(paper, x + k*rdx, y_body_base + param.row_height/2 + d5y + k*rdy + oy, '\ue603', fs, "lc", "icomoon");
						rg.push(text);
					}
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
				var r = draw_boundary('end', e, ne, nm ? nm.new_line : false, paper, x, y_body_base + d5y, param, draw);
				x = r.x;
			}else if(e instanceof DaCapo){
				text = raphaelText(paper, x, y_body_base - 8 + d5y/* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
				if(rs_area_detected) x += text.getBBox().width;
			}else if(e instanceof DalSegno){
				text = raphaelText(paper, x, y_body_base - 8 + d5y/* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
				if(rs_area_detected) x += text.getBBox().width;
			}else if(e instanceof ToCoda){
				if(rs_area_detected){
					var text = raphaelText(paper, x, y_body_base + d5y, "To", 15, "lb").attr(param.repeat_mark_font);	
					x += (text.getBBox().width + 5);
					var coda = draw_coda(paper, x, y_body_base + d5y, "lb", e);
					x += coda.getBBox().width;
				}else{
					var coda = draw_coda(paper, x, y_body_base + d5y, "rb", e);
					text = raphaelText(paper, x - coda.getBBox().width*1.5, y_body_base + d5y, "To", 15, "rb").attr(param.repeat_mark_font);		
				}
			}else if(e instanceof Fine){
				text = raphaelText(paper, x, y_body_base - 8 + d5y/* + row_height + 8*/, e.toString(), 15, lr+"c").attr(param.repeat_mark_font);
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
			}else{
				throw "ERROR";
			}
		}
		
		meas_height += param.row_height;
		
		// Draw Rythm Slashes
		if(rs_area_detected){
			var rdy = 10;
			var g = render_rhythm_slash(
					chord_and_rests, paper,
					y_body_base + rdy,
					meas_start_x, meas_end_x, 
					param, draw, 0, m.body_scaling, all_has_length);
			
			meas_height += param.rs_area_height;
			
			if(!g){
				render_empty_rythm_slash(paper, body_base, y_body_base + rdy,
						m.body_width, 4, param, m.body_scaling);
			}
		}
		
		meas_height += param.row_margin;
		
		m.renderprop.meas_height = meas_height;
		measure_heights.push(meas_height);
		
	} // elements loop
	
	if(rs_area_detected){
		for(var i = 0; i < 5; ++i){
			var intv = 6;
			var dy = 5;
			if(draw) paper.path( svgLine([[first_meas_start_x, y_body_base + param.row_height + i*intv + dy],[last_meas_end_x, y_body_base + param.row_height + i*intv + dy]]) ).attr({'stroke-width':'1px'});
		}
	}
	
	y_base += Math.max.apply(null, measure_heights);
	
	return {y_base:y_base};
}

function getGlobalMacros(track)
{
	var macros_to_apply = {};
	
	macros_to_apply.x_global_scale = 1.0;
	if( "XSCALE" in track.macros ){
		macros_to_apply.x_global_scale = parseFloat(track.macros["XSCALE"]);
	}
	
	macros_to_apply.transpose = 0;
	if( "TRANSPOSE" in track.macros)
	{
		var t = parseInt(track.macros["TRANSPOSE"]);
		if(!isNaN(t))
			macros_to_apply.transpose = t;
	}
	
	macros_to_apply.half_type = "GUESS";
	if( "HALF_TYPE" in track.macros)
	{
		macros_to_apply.half_type = track.macros["HALF_TYPE"]; // "SHARP","FLAT","GUESS"
	}
	
	macros_to_apply.staff = "AUTO";
	if( "STAFF" in track.macros)
	{
		macros_to_apply.staff = track.macros["STAFF"];
	}
	
	return macros_to_apply;
}

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

function render_impl(canvas, track, just_to_estimate_size, param, progress_cb)
{	
	var draw = !just_to_estimate_size;
	
	console.log("render_impl called with " + draw);
	
	//if(draw) paper.clear();
	//if(clear_paper) clearPapers(canvas);
	
	var y_title_offset = param.y_title_offset;
	var x_offset = param.x_offset;
	var width = param.paper_width - x_offset * 2;
	var paper = null;
	if(draw){
		paper = makeNewPaper(canvas, param);
	}else{
		// Dammy paper object 
		paper = Raphael($("#invisible_view")[0], param.paper_width, param.paper_height);
	}
		
	var y_base = param.y_first_page_offset;
	
	var songname = "No Name";

	// Title
	if( "TITLE" in track.macros )
	{
		if(draw) raphaelText(paper, x_offset + width/2, y_title_offset, track.macros["TITLE"], 24, "ct"); 
		songname = track.macros["TITLE"];
	}
	
	if( "ARTIST" in track.macros )
	{
		if(draw) raphaelText(paper, x_offset + width, param.y_author_offset, track.macros["ARTIST"], 14, "rt"); 		
		songname += ("/"+track.macros["ARTIST"]);
	}

	var global_macros = getGlobalMacros(track);
	
	/*
	var x_global_scale = 1.0;
	if( "XSCALE" in track.macros ){
		x_global_scale = parseFloat(track.macros["XSCALE"]);
	}
	
	var transpose = 0;
	if( "TRANSPOSE" in track.macros)
	{
		var t = parseInt(track.macros["TRANSPOSE"]);
		if(!isNaN(t))
			transpose = t;
	}
	
	var half_type = "GUESS";
	if( "HALF_TYPE" in track.macros)
	{
		half_type = track.macros["HALF_TYPE"]; // "SHARP","FLAT","GUESS"
	}
	
	var staff = "AUTO";
	if( "STAFF" in track.macros)
	{
		staff = track.macros["STAFF"];
	}
	*/
	
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
			y_stacks.push({type:'reharsal',height:param.rm_area_height,cont:track.reharsal_groups[i]});
			var rg = track.reharsal_groups[i];
			var row_max_height = 0;
			var meas_row = [];
			var pm = null;
			for(var ml = 0; ml < rg.measures.length; ++ml){
				var m = rg.measures[ml];
				if(m.new_line){
					y_stacks.push({type:'meas', height:row_max_height,cont:meas_row,
						nm:m,pm:pm,rg:track.reharsal_groups[i],macros:rg_macros});
					row_max_height = 0;
					meas_row = [];
					pm = ml>0?rg.measures[ml-1]:null;
				}
				meas_row.push(m);
				row_max_height = Math.max(row_max_height, m.renderprop.meas_height);
			}
			if(row_max_height > 0)
				y_stacks.push({type:'meas', height:row_max_height,cont:meas_row,
					nm:null,pm:pm,rg:track.reharsal_groups[i],macros:rg_macros});
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
		var y_stacks = [{type:'titles',height:x_offset}];
		for(var i = 0; i < track.reharsal_groups.length; ++i)
		{
			var rg_macros = getMacros(global_macros, track.reharsal_groups[i]);
			y_stacks.push({type:'reharsal',height:param.rm_area_height,cont:track.reharsal_groups[i]});
			var rg = track.reharsal_groups[i];
			y_stacks.push({type:'meas',height:0,cont:rg.measures,
				nm:null,pm:null,rg:track.reharsal_groups[i],macros:rg_macros});
		}
		pageslist.push(y_stacks);
	}
	
	/* Paging */
	console.log("render_impl called with " + draw + " : Invoke async loop execution");
	
	if(g_async_mode){
		Task.Foreach(pageslist, function(pageidx, len, page, ctx1){
			
			Task.Foreach(page, function(pei,yselen, yse, ctx2){
				
				if(progress_cb){
					progress_cb((ctx2.draw ? "":"Pre-")+"Rendering block " + pei + " in page " + (pageidx+1) + " of " + songname);
				}
				
				if(yse.type == 'titles'){
					
				}else if(yse.type == 'reharsal'){
					x = x_offset;
					var rg = yse.cont;
					
					if(ctx2.draw){
						var g = raphaelTextWithBox(ctx2.paper, x, ctx2.y_base, rg.name, 18);
					}
					
					ctx2.y_base += ctx2.param.rm_area_height; // Reharsal mark area height
					
				}else if(yse.type == 'meas'){
					x = x_offset;
					var row_elements_list = yse.cont;
					var r = render_measure_row(
							ctx2.paper, yse.macros.x_global_scale, yse.macros.transpose, 
							yse.macros.half_type, row_elements_list, yse.pm, yse.nm,
							ctx2.y_base, ctx2.param, ctx2.draw,
							yse.macros.staff);
					ctx2.y_base = r.y_base;
				}
				
			}, ctx1, "renderpageelemloop");
			
			var lasttask = Task.enqueueFunctionCall(function(){
				if(ctx1.draw && pageidx != pageslist.length-1){
					ctx1.paper = makeNewPaper(canvas, ctx1.param);
					ctx1.y_base = ctx1.param.y_offset;
				}}, [], "renderpageelemloop");
			
			return lasttask;
			
		},{param:param,draw:draw,paper:paper,y_base:y_base}, "renderpageloop");
		
		var task = Task.enqueueFunctionCall(function(){
			if(!draw){
				$("#invisible_view").children().remove();
			}
		}, [], "renderpageloop");
		
		return task;
		
	}else{
		for(var pageidx = 0; pageidx < pageslist.length; ++pageidx){
			
			var yse = pageslist[pageidx];
			for(var pei = 0; pei < yse.length; ++pei){
				if(yse[pei].type == 'titles'){
					
				}else if(yse[pei].type == 'reharsal'){
					x = x_offset;
					var rg = yse[pei].cont;
					
					if(draw){
						var g = raphaelTextWithBox(paper, x, y_base, rg.name, 18);
					}
					
					y_base += param.rm_area_height; // Reharsal mark area height
					
				}else if(yse[pei].type == 'meas'){
					x = x_offset;
					var row_elements_list = yse[pei].cont;
					var r = render_measure_row(
							paper, yse[pei].macros.x_global_scale, yse[pei].macros.transpose,
							yse[pei].macros.half_type, row_elements_list, 
							yse[pei].pm, yse[pei].nm,
							y_base, param, draw, yse[pei].macros.staff);
					y_base = r.y_base;
				}
			}
	
			if(draw && pageidx != pageslist.length-1){
				paper = makeNewPaper(canvas, param);
				y_base = param.y_offset;
			}
		} // reharsal group loop
	
		
		if(!draw){
			$("#invisible_view").children().remove();
		}
	
	} // end async switch
}

function draw_segno(paper, x, y, segno)
{
	var rsr = paper; //Raphael('rsr', '708.53131', '776.59619'); 
	var path3001 = rsr.path("m 7.45119,0.00462507 c -2.62006,-0.12965 -4.89531,2.48917003 -4.5203,5.06077003 0.30852,2.3265 2.16735,4.12974 4.20376,5.1011599 1.65879,0.86938 3.71404,0.71264 5.22694,1.90481 1.39044,1.02552 1.92776,3.15917 0.89399,4.61515 -0.59006,0.8633 -1.60565,1.57525 -2.69669,1.40546 -0.51026,-0.79781 -0.0548,-1.84761 -0.5841,-2.65244 -0.50017,-0.97685 -1.7314,-1.52668 -2.77051,-1.09339 -1.09273,0.36861 -1.55201,1.78786 -0.96315,2.76184 0.95747,1.95409 3.44952,2.65453 5.45383,2.15374 2.52866,-0.60348 4.08162,-3.66205 3.0424,-6.05383 -0.87324,-2.27646 -3.05164,-3.8349199 -5.33435,-4.4943599 -1.63211,-0.39445 -3.53265,-0.67749 -4.56541,-2.16526 -0.96216,-1.25884 -0.91035,-3.20529 0.26205,-4.31632 0.58015,-0.61405 1.43392,-1.05559 2.29618,-0.91468 0.51027,0.79781 0.0548,1.84762 0.5841,2.65244 0.50017,0.97686 1.7314,1.52668 2.77051,1.09339 1.0378,-0.35178 1.53161,-1.67674 1.0195,-2.63799 C 11.07123,0.77410507 9.16303,-0.05833493 7.45119,0.00462507 z"); path3001.attr({id: 'path3001',"font-size": 'medium',"font-style": 'normal',"font-variant": 'normal',"font-weight": 'normal',"font-stretch": 'normal',"text-indent": '0',"text-align": 'start',"text-decoration": 'none',"line-height": 'normal',"letter-spacing": 'normal',"word-spacing": 'normal',"text-transform": 'none',direction: 'ltr',"block-progression": 'tb',"writing-mode": 'lr-tb',"text-anchor": 'start',"baseline-shift": 'baseline',color: '#000000',fill: '#000000',"fill-opacity": '1',stroke: 'none','stroke-width':'1','stroke-opacity':'1',"stroke-width": '50',marker: 'none',visibility: 'visible',display: 'inline',overflow: 'visible',"enable-background": 'accumulate',"font-family": 'Sans',"-inkscape-font-specification": 'Sans'}).data('id', 'path3001'); var path3807 = rsr.path("m 15.97079,8.1489251 c 0.005,0.3706 -0.23305,0.72802 -0.57561,0.8684 -0.33653,0.14657 -0.75456,0.0707 -1.01709,-0.18618 -0.26603,-0.24718 -0.3631,-0.65442 -0.23893,-0.99541 0.12006,-0.35345 0.46727,-0.61404 0.84067,-0.62804 0.36299,-0.0235 0.72582,0.18693 0.88786,0.51217 0.0679,0.13213 0.10333,0.28054 0.1031,0.42906 z"); path3807.attr({id: 'path3807',fill: '#000000',stroke: '#000000',"stroke-width": '0',"stroke-linecap": 'round',"stroke-miterlimit": '4',"stroke-opacity": '1',"stroke-dasharray": 'none'}).data('id', 'path3807'); var path3822 = rsr.path("m 3.38842,11.049785 c 0.005,0.3706 -0.23305,0.72802 -0.57561,0.8684 -0.33653,0.14657 -0.75456,0.0707 -1.01709,-0.18618 -0.26603,-0.24718 -0.3631,-0.65442 -0.23893,-0.99541 0.12006,-0.35345 0.46727,-0.61404 0.84067,-0.62804 0.36299,-0.0235 0.72582,0.18693 0.88786,0.51217 0.0679,0.13213 0.10333,0.28054 0.1031,0.42906 z"); path3822.attr({id: 'path3822',fill: '#000000',stroke: '#000000',"stroke-width": '0',"stroke-linecap": 'round',"stroke-miterlimit": '4',"stroke-opacity": '1',"stroke-dasharray": 'none'}).data('id', 'path3822'); var path3803 = rsr.path("M 15.69138,2.8164551 C 10.46092,7.2657851 5.23046,11.715125 0,16.164455 c 0.68845,-0.002 1.37691,-0.003 2.06536,-0.005 5.21598,-4.44988 10.43195,-8.8997599 15.64793,-13.3496399 -0.67397,0.002 -1.34794,0.004 -2.02191,0.007 z"); path3803.attr({id: 'path3803',"font-size": 'medium',"font-style": 'normal',"font-variant": 'normal',"font-weight": 'normal',"font-stretch": 'normal',"text-indent": '0',"text-align": 'start',"text-decoration": 'none',"line-height": 'normal',"letter-spacing": 'normal',"word-spacing": 'normal',"text-transform": 'none',direction: 'ltr',"block-progression": 'tb',"writing-mode": 'lr-tb',"text-anchor": 'start',"baseline-shift": 'baseline',color: '#000000',fill: '#000000',"fill-opacity": '1',stroke: 'none','stroke-width':'1','stroke-opacity':'1',"stroke-width": '49.9',marker: 'none',visibility: 'visible',display: 'inline',overflow: 'visible',"enable-background": 'accumulate',"font-family": 'Sans',"-inkscape-font-specification": 'Sans'}).data('id', 'path3803'); var rsrGroups = [];
	var group = rsr.set();
	
	group.push(path3001, path3807, path3822, path3803);
	var h = group.getBBox().height;
	if(segno.number !== null)
		group.push( raphaelText(paper, group.getBBox().width, h + 4, segno.number, 20, "lb"));
	if(segno.opt !== null)
		group.push( raphaelText(paper, group.getBBox().width, h + 3, "("+segno.opt+")", 16, "lb"));
	
	group.transform("t"+x +","+y);
	return group;
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
	group.transform("t"+x+","+(y-2));
	return group;
}
