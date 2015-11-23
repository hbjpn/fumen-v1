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

var WHOLE_NOTE_LENGTH = 2*3*5*7*9*11*13*64;

function Track()
{
	this.reharsal_groups = new Array();
	this.macros = {};
}

function ReharsalGroup()
{
	this.name = null;
	this.measures = new Array();
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

function Rest(length, huten)
{
	var tp = WHOLE_NOTE_LENGTH / length;
	this.length_s = ""+length+(huten?huten:"");
	this.length = WHOLE_NOTE_LENGTH / length;
	var hs = huten ? huten : "";
	for(var i = 0; i < hs.length; ++i){
		tp /= 2;
		this.length += tp;
	}
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

function Chord(chord_str)
{
	this.chord_str = chord_str;
	
	this.is_valid_chord = true;	
	
	this.length = WHOLE_NOTE_LENGTH;
	this.length_s = null;
	this.tie = false;
	
	this.renderprop = {};

	// Analyze Chord symbol
	var r = /^(((A|B|C|D|E|F|G)(#|b)?([^\/\:]*))?(?:\/(A|B|C|D|E|F|G)(#|b)?)?)(:(\d+)(\.*))?(\~)?/;
	var m = chord_str.match(r);
	//console.log(m);
	// [0] is entire matched string
	if( m && m[0] != ""){
		this.chord_name_str = m[1];
		this.note_base = m[3];
		this.sharp_flat = m[4];
		this.mid_str = m[5];
		this.base_note_base = m[6];
		this.base_sharp_flat = m[7];
		
		this.mid_elems = null;
		if(this.mid_str !== undefined){
			var ret = parseChordMids(this.mid_str);
			if(ret !== null){
				this.mid_elems = ret[0];
				this.mid_elem_objs = ret[1];
			}
			this.is_valid_chord = (ret !== null);
		}
		if(m[8]){
			var ps = m[10]?m[10]:"";
			this.length_s = m[9]+(m[10]?m[10]:""); // "number + .";
			this.length = WHOLE_NOTE_LENGTH / parseInt(m[9]);
			var tp =  WHOLE_NOTE_LENGTH / parseInt(m[9]);
			for(var j = 0; j < ps.length; ++j){
				tp /= 2;
				this.length += tp;
			}
		}
		
		this.tie = (m[11] == '~');
	}else{
		this.chord_name_str = this.chord_str;
		this.is_valid_chord = false;
	}
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

Chord.prototype.getChordStr = function(tranpose, half_type)
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
	
	// Assuming font mapping
	var mid_str = "";
	if(this.mid_elems !== null){
		for(var i = 0; i < this.mid_elems.length; ++i){
			switch(this.mid_elems[i].cs){
				case CS_M:
					var s = this.mid_elems[i].s; 
					var isMaj = (s == "M" || s.toLowerCase() == "maj" || s.toLowerCase() == "ma");
					mid_str += (isMaj ? 'M' : 'm');
					break;
				case CS_DIG:
					var m = {"11":"\x25","13":"\x26"};
					if(this.mid_elems[i].s in m)
						mid_str += m[this.mid_elems[i].s];
					else
						mid_str += this.mid_elems[i].s;
					break;
				case CS_SUS: mid_str += 's'+this.mid_elems[i].s.substr(3);	break;
				case CS_DIM: mid_str += 'd'; break;
				case CS_MNS: mid_str += 'b'+this.mid_elems[i].s.substr(1);	break;
				case CS_PLS: mid_str += '#'+this.mid_elems[i].s.substr(1);	break;
				case CS_ADD: mid_str += 'a'+this.mid_elems[i].s.substr(3);  break;
				case CS_ALT: mid_str += this.mid_elems[i].s; break;
				case CS_SEP: mid_str += this.mid_elems[i].s; break;
			}
		}
	}
	
	var refs = (tranposed_note ? tranposed_note + mid_str : "") + ( transposed_base_note ? ("/"+transposed_base_note) : "" );
	return [true,refs];
};

function LoopIndicator(indicators)
{
	this.indicators = indicators;
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

function LoopEndMark(times)
{
	this.times = times;
}

function LoopBothMark(times)
{
	this.times = times;
}

function MeasureBoundaryFinMark()
{
}

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


function Parser(error_msg_callback)
{
/*
 Here EBNF representation of fumen grammer
 
 score = {macro_exp | reharsal_part};
 macro_exp = "%", regular_string, "=", value;
 regular_string = "a"|"b"|"c"|"d";
 value = string_token | number;
 string_token = '"', any_string_excluding_dq, '"' | "'", any_string_excluding_sq, "'";
 number = "1"|"2"|"3"|"4"|"5";  
  
 reharsal_part = reharsal_mark, {measure_line};
 reharsal_mark = "[", string_token, "]" | "[", regular_string, "]";
  
 measure_line = {measure_boundary, measure_content}, measure_boundary, measure_line_end;
 measure_line_end = "\n"; 
  
 measure_boundary = "|" | "||" | "||:" | ":||" | ":||:" | "|||";
 measure_content = {repeat_bracket | time_indicator | chord_symbol | inline_spaces};
  
 repeat_bracket = "[", regular_string, "]" | "[", string_token, "]";
 time_indicator = "(", integer, "/", integer, ")";
 note = "A"|"B"|"C"|"D"|"E"|"F"|"G";
 chord_symbol = note,["#"|"b"],[chord_tensions],[("/"|"on"),note];
 chord_tensions = chord_tension,[",",chord_tension];
 chord_tension = (["+"|"-"],"7"|"9"|"13"|"6"|"5")|("sus4"|"aug"|"dim");
  inline_space = " "|"\t";
 inline_spaces = inline_space,{inline_space};
  
 space = inline_space | "\n" | "\r";
 ignorelable_spaces = space, {space}; 
 
 any_string_excluding_dq = "a"|"b"|"c";
 any_string_excluding_sq = "a"|"b"|"c";
	  
*/
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
var TOKEN_STRING = 25;

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
	if(s[0] == '"' || s[0] == "'")
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
		
		return {token:plain_str, s:s, type:TOKEN_STRING, ss:skipped_spaces};
	}
		
	var r = charIsIn(s[0], '[]<>(),\n\/%=');
	if(r != null){
		return {token: s[0], s: s.substr(1), ss:skipped_spaces,
			type: [
				TOKEN_BRACKET_LS, TOKEN_BRACKET_RS,
				TOKEN_BRACKET_LA, TOKEN_BRACKET_RA,
				TOKEN_BRACKET_LR, TOKEN_BRACKET_RR,
				TOKEN_COMMA, TOKEN_NL, TOKEN_SLASH,
				TOKEN_PERCENT, TOKEN_EQUAL][r.index]
		};
	}
	
	var r = charStartsWithAmong(s, ["||:","||.","||","|"]);
	if(r != null){
		return {token:r.s, s:s.substr(r.s.length), ss:skipped_spaces,
			type: [
				TOKEN_MB_LOOP_BEGIN, TOKEN_MB_FIN, TOKEN_MB_DBL, TOKEN_MB][r.index]
		};
	}
	
	var m = null;
	m = s.match(/^(\:\|\|\:?)(x(\d+))?/); // ":||" or ":||:". Repeat number can be specified as "x<digit>"
	if (m != null)
	{
		var loopTimes = 2;
		if(m[2]!=null)
			loopTimes = Number(m[3]);
		return {token:m[0],s:s.substr(m[0].length), ss:skipped_spaces, type:(m[1]==":||:" ? TOKEN_MB_LOOP_BOTH : TOKEN_MB_LOOP_END),param:loopTimes};
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
	if(index < 0) throw "Parse error on Sign";
	
	var signStr = s.slice(0, index);
	s = s.slice(index+1); // ">" is skipped
	
	// Parse sign string
	// "D.S.([0-9]+)?( al Coda([0-9]+)?)
	var r = this.nextToken(signStr, WORD_DEFINIITON_GENERAL); 
	if(r.type != TOKEN_WORD) throw "Error";
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
		if(r.type != TOKEN_WORD) throw "Error";
		m = r.token.match(regCoda);
		if(m === null) throw "Error";
		sign = new ToCoda(m[1] === undefined ? null : m[1]);
	}else if( (m = r.token.match(regDS)) !== null){
		var dsNumber = m[1] === undefined ? null : m[1];
		var al = null;
		r = this.nextToken(r.s, WORD_DEFINIITON_GENERAL);
		if(r.type == TOKEN_END){
		}else{
			if(r.type != TOKEN_WORD) throw "Error";
			if(r.token != "al") throw "Error";
			r = this.nextToken(r.s, WORD_DEFINIITON_GENERAL);
			if(r.type != TOKEN_WORD) throw "Error";
			if(r.token == "Fine") al = new Fine();
			else if( (m = r.token.match(regCoda)) !== null ) al = new Coda(m[1] === undefined ? null : m[1]);
			else throw "Error";
		}
		sign = new DalSegno(dsNumber, al);
	}else{
		throw "Error";
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
	var r = /^r\:(1|2|4|8|16|32|64)(\.*)$/;
	var m = trig_token.match(r);
	var rest = null;
	if(m){
		rest = new Rest(parseInt(m[1]),m[2]);
	}
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
	while(loop_flg){
		var r = this.nextToken(s);
		switch(r.type){
		case TOKEN_STRING:
			measure.elements.push(new Chord(r.token));
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
			// To SLASH
		case TOKEN_SLASH:
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

Parser.prototype.parseMeasures = function(trig_token_obj, s)
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
	
	while(true){
		r = this.nextToken(s);
		//console.log(r);
		if(r.type == TOKEN_END) break;
		else{
			if(r.type == TOKEN_BRACKET_LS){
				r = this.parseReharsalMark(r.token, r.s);
				//console.log("Reharsal Mark:"+r.reharsalMarkName);
				if(currentReharsalGroup != null)
					track.reharsal_groups.push(currentReharsalGroup);
				currentReharsalGroup = new ReharsalGroup();
				currentReharsalGroup.name = r.reharsalMarkName;
			}else if([TOKEN_MB, TOKEN_MB_DBL, TOKEN_MB_LOOP_BEGIN, TOKEN_MB_LOOP_BOTH, TOKEN_MB_FIN].indexOf(r.type) >= 0){
				r = this.parseMeasures(r, r.s);
				currentReharsalGroup.measures =
					currentReharsalGroup.measures.concat(r.measures);
			}else if(r.type == TOKEN_PERCENT){
				// Expression
				r = this.parseMacro(r.s);
				if(currentReharsalGroup){
					currentReharsalGroup.macros[r.key] = r.value;
				}else{
					track.macros[r.key] = r.value;
				}
			}else if(r.type == TOKEN_NL){
				this.context.line += 1;
			}else{
				console.log(r.token);
				this.onParseError("ERROR_WHILE_PARSE_MOST_OUTSIDER");
			}
			s = r.s;
		}
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
