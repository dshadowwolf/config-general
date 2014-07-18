var fs = require('fs'),
    console = require('console'),
    util = require('util'),
    emitter = require('events').EventEmitter;


function preparse(ins) {
  var rstack = [];

  var cpos = 0;
  var ct = "";

  while( cpos < ins.length ) {
    if( ct.slice(-1) == '>' ||
        ins[cpos] == '\n' ) {
      rstack.push(ct);
      ct = "";
    } else if( ins[cpos] == '\r' &&
               (ins[cpos - 1] == '\n' ||
                ins[cpos + 1] == '\n') ) {
      // skip this value, do nothing about it
      // this will keep it out of the output
    } else {
      ct += ins[cpos];
    }

    cpos++;
  }

  if( ct !== "" )
    rstack.push(ct);

  return rstack;
}

function tokenizer(options) {
  var base_options = {
    'SplitPolicy': 'guess',
    'CComments': 'true',
    'SlashIsDirectory': false,
    'UseApacheInclude': false
  };

  emitter.apply(this);
  this.buffer = [];
  this.token_stack = [];
  this.cpos = 0;
  this.filename = "";
  this.options = base_options;
  this.events = [ 'tagopen', 'tagclose', 'keyvalue', 'end', 'includereq', 'selfclose' ];

  var self = this;
  Object.keys(options).forEach( function( e, i, o ) {
    self.options[e] = options[e];
  });

  if( this.options.DefaultConfig !== undefined )
    this.buffer = this.options.DefaultConfig.split("\n");
  if( this.options.String !== undefined ) {
    if( Array.isArray(this.options.String) ) {
      if( this.buffer.length > 0 )
        this.buffer = this.buffer.concat(this.process(this.options.String));
      else
        this.buffer = this.process(this.options.String);
    } else {
      // process the string into an array so we can properly feed the beast
      // each tag, heredoc opening, etc... gets a separate entry in the
      // buffer. We do no processing beyond that. However, all we can do
      // is split by newline and hope that works
      var temp = preparse(this.options.String);
      console.warn( 'The system for turning an input string into the stack of separate lines is currently very broken. Proper use of this method would involve separating your input into separate lines and passing an array as the parameter for this option.');
      if( this.buffer.length > 0 )
        this.buffer = this.buffer.concat(this.process(temp));
      else
        this.buffer = this.process(temp);
    }
  } else if( this.options.ConfigFile ) {
    var tb;
    this.filename = this.options.ConfigFile;

    tb = fs.readFileSync( this.filename, 'utf8' ).split('\n');
    if( this.buffer.length > 0 )
      this.buffer = this.buffer.concat(this.process(tb));
    else
      this.buffer = this.process(tb);
  } else {
    throw new Error('no input to process');
  }
  this.build_stack();
}

tokenizer.prototype = Object.create( emitter.prototype );

tokenizer.prototype.process = function( data ) {
  var rv = [];
  var pos = 0;

  var temp = data;

  var current = temp[pos];

  while( pos < temp.length ) {
    if( !(/^\s*\/\/.*$/.test(current)) &&
        !(/^\s+$/.test(current)) &&
        !(/^\s*(?:#.*)?$/.test(current)) &&
          current != '' ) {
      var ic;
      var td;
      var xx;

      if( /<</.test(current) && !(/>>/.test(current))) {
        td = current.match(/\s*(.*)\s*<<\s*(.*)\s*(?:(?:#|\/\/)?.*)$/)[2];
        td = td.trim();

        xx = new RegExp('^\\s*'+td+'\\s*$');
        while( !(xx.test(current) ) )  {
          rv.push(current);
          pos++;
          current = temp[pos];
          if( pos >= temp.length )
            return rv;
        }
        rv.push(current);
      } else if( this.options.CComments && /^\s*\/\*.*$/.test(current) ) {
        pos++;
        current = temp[pos];
        while( !(/^\s*\*\/\s*$/.test(current)) &&
                pos < temp.length ) {
          pos++;
          current = temp[pos];
        }
      } else {
        rv.push(current);
      }
      pos++;
      current = temp[pos];
    } else {
      pos++;
      current = temp[pos];
    }
  }

  return rv;
};

tokenizer.prototype.build_stack = function() {
  var self = this;

  if( self.buffer.length === 0 )
    throw new Error("cannot build token list without input data");

  var wb = self.buffer;
  var bpos = 0;

  function kill_ws(line) {
    return line.trim();
  }

  function get_tag_contents(line) {
    var match = line.match(/\s*<(.*)>.*/);
    return match[1];
  }

  function get_string(line) {
    var cp = 1;
    var out = "";
    var ls = line[0];

    while( cp < line.length ) {
      if( line[cp] != ls ||
          (line[cp] == ls &&
           line[cp - 1] == '\\') )
        out = out + line[cp];
      else
        return out;
    }

    throw new Error('end of input encountered before end of string');
  }

  function get_data_no_comment(line) {
    var cp = 0;
    var out = "";

    while( cp < line.length ) {
      if( line[cp] != '#' ) {
        out = out + line[cp];
      } else if( line[cp] == '#' &&
                 line[cp - 1] == '\\' ) {
        out = out + line[cp];
      } else {
        return out;
      }
      cp++;
    }

    return out;
  }

  while( bpos < wb.length ) {
    var work = kill_ws(wb[bpos]);
    var temp_buff = "";
    if( /<</.test(work) && !(/>>/.test(work))) {
      // heredoc
      var t = work.split(/<</);
      var hdm = new RegExp('^'+kill_ws(t[1])+'$');
      var lb = "";
      bpos++;
      work = kill_ws(wb[bpos]);
      while( !hdm.test(work) ) {
        if( lb != "" )
          lb += "\n"+work;
        else
          lb = work;

        bpos++;
        if( bpos >= wb.length )
          return;
        work = kill_ws(wb[bpos]);
      }
      var b = kill_ws(t[0]);
      if( b.slice(-1) == '=' )
        b = b.slice(0,-1).trim();

      self.token_stack.push( { type: 'keyvalue', value: { key: b, value: lb }});
    } else if( /<</.test(work) && />>/.test(work) ) {
      // specific type of processing directive.
      // right now the only existing one is 'include'
      var rv = { type: 'include' };
      var mm = work.match(/^<<(.*)>>(?:\s*#.*)?$/)[1];
      if( mm.split(/\s/)[0].toLowerCase() != 'include' )
        throw new Error('unknown processing directive found in input');
      rv.value = kill_ws(mm.split(/\s/).slice(1).join(' '));
      self.token_stack.push(rv);
    } else if( /^\s*</.test(work) ) {
      // tag of some sort
      var rr = {};
      temp_buff = get_tag_contents(work);
      if( temp_buff[0] == '/' )
        rr.tt = 'closing';
      else if( temp_buff.slice(-1) == '/' &&
                   !self.options.SlashIsDirectory )
        rr.tt = 'selfclosing';
      else //assume it's an open tag
        rr.tt = 'opening';

      if( rr.tt == 'closing' )
        temp_buff = temp_buff.slice(1);

      if( temp_buff[0] == '"' ) {
        var l;
        rr.tn = get_string(temp_buff);
        l = rr.tn.length + 2; // get_string returns the value without the opening or closing quotes
        temp_buff = kill_ws(temp_buff.slice(l));
      } else {
        rr.tn = temp_buff.split(/\s/)[0];
        temp_buff = kill_ws(temp_buff.split(/\s/).slice(1).join(' '));
      }

      if( rr.tt == 'selfclosing' && temp_buff.slice(-1) == '/' )
        temp_buff = temp_buff.slice(0,-1);

      if( /^\".*\"$/.test(temp_buff) ) // we've still got a string left
        rr.td = get_string(temp_buff);
      else
        rr.td = kill_ws(temp_buff);

      if( rr.td === "" || /^\s+$/.test(rr.td) )
        rr.td = undefined;

      self.token_stack.push( { type: rr.tt, value: { name: rr.tn, data: rr.td } } );
    } else {
      // key-value pair. This is the least tricky one.
      // 'guess' or 'whitespace' when there is no equalsign
      // present will split at the first piece of whitespace
      // regardless of whether the opening starts with any
      // form of quote
      var rs;
      work = get_data_no_comment(work);
      if( work.slice(-1) == '\\' ) {
        while( work.slice(-1) == '\\' ) {
          if( temp_buff !== undefined )
            temp_buff = temp_buff + " " + kill_ws(work);
          else
            temp_buff = kill_ws(work);

          temp_buff = kill_ws(temp_buff.slice(0,-1));
          bpos++;
          work = kill_ws(wb[bpos]);
        }
        temp_buff = temp_buff + " " + kill_ws(work);
      }

      if( temp_buff === "" )
        temp_buff = work.trimLeft();

      temp_buff = temp_buff.trimLeft();
      if( self.options.SplitPolicy == 'guess' ) {
        // prefer shorter keys
        if( /\s*=\s*/.test(temp_buff) ) {
          var tmp = temp_buff.split('=')[0].trim();
          var tmp2 = temp_buff.split(/\s/)[0].trim();
          if( tmp.length <= tmp2.length )
            rs = temp_buff.split('=');
          else
            rs = temp_buff.split(/\s/);
        } else {
          rs = temp_buff.split(/\s/);
        }
        rs = rs.filter( function(e) { return (e !== '' && !(/^\s*$/.test(e))); } );
      } else if( self.options.SplitPolicy == 'whitespace' ) {
          rs = temp_buff.split(/\s/);
      } else if( self.options.SplitPolicy == 'equalsign' ) {
        rs = temp_buff.split('=');
      } else if( self.options.SplitPolicy == 'custom' ) {
        var splitter;
        if( self.options.SplitDelimiter !== undefined )
          splitter = new RegExp(self.options.SplitDelimiter);
        else
          throw new Error('SplitPolicy set to \'custom\' but no SplitDelimiter supplied');

        rs = temp_buff.split(splitter);
      }

      if( rs[0].toLowerCase() == 'include' &&
          self.options.UseApacheInclude )
        self.token_stack.push( { type: 'include', value: rs.slice(1).join(' ') } );
      else
        self.token_stack.push( { type: 'keyvalue', value: { key: rs[0].trim(), value: rs.slice(1).join(' ').trim() } } );
    }
    bpos++;
  }
};

tokenizer.prototype.get_token = function() {
  var self = this;
  if( self.token_stack.length === 0 ) {
    return { type: 'end' };
  }

  var cl = self.token_stack.shift();
  var rv = {};

  switch(cl.type) {
    case 'include':
    rv.type = 'includereq';
    rv.pattern = cl.value;
    break;
    case 'opening':
    rv.type = 'tagopen';
    rv.tagname = cl.value.name;
    rv.data = cl.value.data;
    break;
    case 'closing':
    rv.type = 'tagclose';
    rv.tagname = cl.value.name;
    break;
    case 'selfclosing':
    rv.type = 'selfclose';
    rv.tagname = cl.value.name;
    rv.data = cl.value.data;
    break;
    case 'keyvalue':
    rv.type = 'keyvalue';
    rv.name = cl.value.key;
    rv.value = cl.value.value;
    break;
  }

  self.cpos++;
  return rv;
};

tokenizer.prototype.next = function() {
  var self = this;

  var work = self.get_token();
  var rv = {};

  switch(work.type) {
    case 'tagopen':
    case 'selfclose':
    rv.name = work.tagname;
    if( work.data !== undefined )
      rv.specname = work.data;
    break;
    case 'tagclose':
    rv = work.tagname;
    break;
    case 'keyvalue':
    rv.name = work.name;
    rv.value = work.value;
    break;
    case 'end':
    break;
    case 'includereq':
    rv.pattern = work.pattern;
    break;
    default:
    throw new Error('unknown data returned from get_token!');
  }

  if( work.type != 'end' )
    self.emit( work.type, rv );
  else
    self.emit( 'end' );
};

module.exports = tokenizer;
