var fs = require('fs'),
    console = require('console'),
    util = require('util'),
    emitter = require('events').EventEmitter;

// all of these regular expressions are necessary.
// except for the multitude of key->value ones.
// for those we can just fall-through to the
// final else and assume we're going to be parsing
// a key-value pair. Then we can do the job without
// regular expressions.
var open_tag = /^(?:\s*)?<([^\s]+)(?:\s+(.+))?>(?:\s*#.*)?$/;
var open_tag_dquote =/^(?:\s*)?<((["'])?(?:\\\2|.)*?\2)>(?:\s*#.*)?$/;
var close_tag = /^(?:\s*)?<\/(.+)?>(?:\s*#.*)?$/;
var close_tag_dquote =/^(?:\s*)?<\/((["'])?(?:\\\2|.)*?\2)>(?:\s*#.*)?$/
var include_tag = /^(?:\s*)?<<include\s+(\S+)\s*>>(?:\s*#.*)?$/;

var comment_open = /\/\*.*/;
var comment_close = /.*\*\//;
var sline_comment = /^(?:\s*)?#(?:.*)?$/;
// key-value pair where the value ends with the multi-line split marker
var key_value_ml_s = /^\s*([^\s]+)\s+((["'])?(?:\\\3|.)*?\3)\s*\\$/;
var key_value_ml_e = /^\s*([^=]+)\s*=\s*((["'])?(?:\\\3|.)*?\3)\s*\\$/;
// non-multiline key-value pairs with or without trailing comments
var key_value_sl_s = /^\s*([^\s]+)\s*((["'])?(?:\\\3|.)*?\3)(?:\s*#.*)?$/;
var key_value_sl_e = /^\s*([^=]+)\s*=\s*((["'])?(?:\\\3|.)*?\3)(?:\s*#.*)?$/;
var ml_continues = /^\s*(.+?)\s*\\$/;
var heredoc_open = /^(\S+?)\s*=?\s*<<\s*(\S+?)\s*$/;

function tokenizer() {
  emitter.apply(this);
  this.buffer = [];
  this.cpos = 0;
  this.filename = "";
  this.events = [ 'tagopen', 'tagclose', 'keyvalue', 'end', 'includereq' ];
}

tokenizer.prototype = Object.create( emitter.prototype );
tokenizer.prototype.open = function( filename ) {
  if( filename == undefined )
    throw new Error("open called without a filename");

  var self = this;
  var tb;
  var inComment = false;
  var inHeredoc = false;
  var heredoc_close = /^@@@###@@@\$\$\$$/;
  self.filename = filename;

  tb = fs.readFileSync( self.filename, 'utf8' ).split('\n');

  tb.forEach( function( elem, index, arr ) {
    if( !/^\s+$/.test(elem) &&
        !elem == "" &&
        !sline_comment.test(elem) ) {
      if( !inHeredoc && heredoc_open.test(elem) ) {
        inHeredoc = true;
        heredoc_close = new RegExp( "^\s*"+elem.match(heredoc_open)[1]+"\s*$" );
      } if( inHeredoc && heredoc_close.test(elem) ) {
        heredoc_close = /^@@@###@@@\$\$\$$/;
        inHeredoc = false;
      } if( !inHeredoc && !inComment && comment_open.test(elem) ) {
        inComment = true;
      } else if( inComment && comment_close.test(elem) ) {
        inComment = false;
      } else if( !inComment ) {
        self.buffer.push( elem );
      }
    }
  });
};

tokenizer.prototype.get_token = function() {
  var self = this;
  if( self.buffer.length == 0 )
    throw new Error("get_token called when a file has not be opened!");

  if( self.cpos >= self.buffer.length ) {
    return { 'type': 'end' };
  }

  var cl = self.buffer[self.cpos];
  var rv = {};

  if( include_tag.test(cl) ) {
    var match = cl.match(include_tag);
    rv['type'] = 'includereq';
    rv['pattern'] = match[1];
    self.cpos++;
    return rv;
  } else if( close_tag_dquote.test(cl) && /"/g.test(cl) ) {
    var match = cl.match(close_tag_dquote);
    rv['type'] = 'tagclose';
    rv['tagname'] = match[1];
    self.cpos++;
    return rv;
  } else if( close_tag.test(cl) ) {
    var match = cl.match(close_tag);
    rv['type'] = 'tagclose';
    rv['tagname'] = match[1].trim();
    self.cpos++;
    return rv;
  } else if( open_tag_dquote.test(cl) && /"/g.test(cl)) {
    var match = cl.match(open_tag_dquote);
    rv['type'] = 'tagopen';
    rv['tagname'] = match[1];
    self.cpos++;
    return rv;
  } else if( open_tag.test(cl) ) {
    var match = cl.match(open_tag);
    rv['type'] = 'tagopen';
    if( match[2] != undefined ) {
      rv['tagname'] = match[1].trim();
      rv['data'] = match[2].trim();
    } else {
      rv['tagname'] = match[1].trim();
    }
    self.cpos++;
    return rv;
 } else if( heredoc_open.test(cl) ) {
    rv['type'] = 'keyvalue';
    var match = cl.match( heredoc_open );
    var key = match[1].trim();
    var endmark = match[2].trim();
    var temp = [];

    self.cpos++;

    while( self.buffer[self.cpos].trim() != endmark ) {
      temp.push( self.buffer[self.cpos] );
      self.cpos++;
    }
    self.cpos++;

    rv['data'] = { 'name': key, 'value': temp.join('\n') };
    return rv;
  } else if( key_value_ml_e.test(cl) ) {
    var match = cl.match(key_value_ml_e);
    var temp = [ match[2].trim() ];
    var key = match[1].trim();
    rv['type'] = 'keyvalue';
    self.cpos++;
    while( ml_continues.test(self.buffer[self.cpos]) ) {
      temp.push( self.buffer[self.cpos].trim().slice(0,-1) );
      self.cpos++;
    }
    // we need the next line after an escaped newline regardless
    temp.push( self.buffer[self.cpos].trim() );
    rv['data'] = { 'name': key, 'value': temp.join(' ') };
      self.cpos++;

    return rv;
  } else if( key_value_ml_s.test(cl) ) {
    var match = cl.match(key_value_ml_s);
    var temp = [ match[2].trim() ];
    var key = match[1].trim();
    rv['type'] = 'keyvalue';
    self.cpos++;
    while( ml_continues.test(self.buffer[self.cpos]) ) {
      temp.push( self.buffer[self.cpos].trim().slice(0,-1) );
      self.cpos++;
    }
    // we need the next line after an escaped newline regardless
    temp.push( self.buffer[self.cpos].trim() );
    rv['data'] = { 'name': key, 'value': temp.join(' ') };
      self.cpos++;

    return rv;
  } else if( key_value_sl_e.test(cl) ) {
    var match = cl.match(key_value_sl_e);
    rv['type'] = 'keyvalue';
    rv['data'] = { 'name': match[1].trim(), 'value': match[2].trim() };
    self.cpos++;
    return rv;
  } else if( key_value_sl_s.test(cl) ) {
    var match = cl.match(key_value_sl_s);
    rv['type'] = 'keyvalue';
    rv['data'] = { 'name': match[1].trim(), 'value': match[2].trim() };
    self.cpos++;
    return rv;
  } else {
    if( self.cpos > self.buffer.length ) {
      rv['type'] = 'end';
      return rv;
    }
    // believe it or not, here is where we can better implement
    // key-value parsing. First we do a test to see if the
    // value ends with \ - if it does, we create a temporary
    // stack, remove the slash, put the current line on the
    // temporary stack... basically handle things like the
    // multi-line/escaped newline construct is in the existing
    // code. Then we check to see if there is a double-quoted string
    // in the data. If there is, only the part of our input
    // line prior to it needs to be checked for the '=' (but only
    // if we are in 'guess' mode or 'equalsign' mode - in 'whitespace'
    // mode we can just use a quick regex to split off the first
    // chunk of text at the first space that isn't escaped or inside
    // a quoted string and in 'custom' mode we just do a 'string.replace'
    // with a function as the replacer so we can actually separate
    // the text at the first occurrence of the separator without
    // interfering with the rest of the text unduly.
    throw new Error("unknown value in input: "+cl);
  }
};

tokenizer.prototype.next = function() {
  var self = this;

  var work = self.get_token();

  switch(work['type']) {
    case 'tagopen':
    var cbd = {};
    cbd['name'] = work['tagname'];
    if( work['data'] != undefined ) {
      cbd['specname'] = work['data'];
    }
    self.emit( 'tagopen', cbd );
    break;
    case 'tagclose':
    self.emit( 'tagclose', work['tagname'] );
    break;
    case 'keyvalue':
    self.emit( 'keyvalue', work['data'] );
    break;
    case 'end':
    self.emit( 'end' );
    break;
    case 'includereq':
    self.emit( 'includereq', work['pattern'] );
    break;
    default:
    throw new Error('unknown data returned from get_token!');
  }
};

module.exports = tokenizer;
