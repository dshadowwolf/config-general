var fs = require('fs'),
    console = require('console'),
    util = require('util'),
    emitter = require('events').EventEmitter;

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
      var temp;
      if( /\n/g.test(this.options.String ) )
        temp = this.options.String.split("\n");
      else
        temp = [ this.options.String ];

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

    cp++;
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

function rs_filter(e) { return (e !== '' && !(/^\s*$/.test(e))); }

function read_heredoc(buffer,start_pos) {
  var work = buffer[start_pos];
  var bpos = start_pos;

  var t = work.split(/<</);
  var hdm = new RegExp('^'+kill_ws(t[1])+'$');
  var lb = "";
  bpos++;
  work = kill_ws(buffer[bpos]);
  while( !hdm.test(work) ) {
    if( lb !== "" )
      lb += "\n"+work;
    else
      lb = work;

    bpos++;
    if( bpos >= buffer.length )
      return undefined;
    work = kill_ws(buffer[bpos]);
  }

  var b = kill_ws(t[0]);

  if( b.slice(-1) == '=' )
    b = b.slice(0,-1).trim();

  var rv = {};
  rv.name = b;
  rv.value = lb;

  return [bpos, rv];
}

function tag_type(buff,sid) {
  if( buff[0] == '/' )
    return 'closing';
  else if( buff.slice(-1) == '/' && !sid )
    return 'selfclosing';
  else //assume it's an open tag
    return 'opening';
}

function tag_name(buff) {
  var r;
  if( buff[0] == '"' ) {
    r = get_string(buff);
  } else {
    r = buff.split(/\s/)[0];
  }
  r = kill_ws(r).trim();
  return r;
}

function read_continued_line(buffer,start) {
  var work = buffer[start];
  var bpos = start;
  var tb;

  while( work.slice(-1) == '\\' ) {
    if( tb !== undefined )
      tb = tb + " " + kill_ws(work);
    else
      tb = kill_ws(work);

    tb = kill_ws(tb.slice(0,-1));
    bpos++;
    work = kill_ws(buffer[bpos]);
  }
  tb = tb + " " + kill_ws(work);

  return [tb,bpos];
}

function do_split( line, pol, delim ) {
  var rs = [], temp;
  if( pol === undefined )
    pol = 'guess';

  if( pol == 'guess' ) {
    // prefer shorter keys
    if( /\s*=\s*/.test(line) ) {
      var tmp = line.split('=')[0].trim();
      var tmp2 = line.split(/\s/)[0].trim();
      if( tmp.length <= tmp2.length ) {
        temp = line.split('=')[0];
        rs.push(temp);
        rs.push(line.replace(temp,'').trim());
      } else {
        temp = line.split(/\s/)[0];
        rs.push(temp);
        rs.push(line.replace(temp,'').trim());
      }
    } else {
        temp = line.split(/\s/)[0];
        rs.push(temp);
        rs.push(line.replace(temp,'').trim());
    }
  } else if( pol == 'whitespace' ) {
        temp = line.split(/\s/)[0];
        rs.push(temp);
        rs.push(line.replace(temp,'').trim());
  } else if( pol == 'equalsign' ) {
    temp = line.split('=')[0];
    rs.push(temp);
    rs.push(line.replace(temp,'').trim());
  } else if( pol == 'custom' ) {
    var splitter;
    if( delim !== undefined )
      splitter = new RegExp(delim);
    else
      throw new Error('SplitPolicy set to \'custom\' but no SplitDelimiter supplied');

    temp = line.split(splitter)[0];
    rs.push(temp);
    rs.push(line.replace(temp,'').trim());
  }

  return rs;
}

tokenizer.prototype.tokenize_and_insert = function( data ) {
  var wb = this.process(data);


  var ms = [];
  var bpos = 0;

  var self = this;



  while( bpos < wb.length ) {
    var work = kill_ws(wb[bpos]);
    var temp_buff = "";
    if( /<</.test(work) && !(/>>/.test(work))) {
      // heredoc
      var d = read_heredoc(wb,bpos);
      if( d === undefined )
        return;

      bpos = d[0];
      ms.push( { type: 'keyvalue', value: { key: d[1].name, value: d[1].value }});
    } else if( /<</.test(work) && />>/.test(work) ) {
      // specific type of processing directive.
      // right now the only existing one is 'include'
      var rv = { type: 'include' };
      var mm = work.match(/^<<(.*)>>(?:\s*#.*)?$/)[1];
      if( mm.split(/\s/)[0].toLowerCase() != 'include' )
        throw new Error('unknown processing directive found in input');
      rv.value = kill_ws(mm.split(/\s/).slice(1).join(' '));
      ms.push(rv);
    } else if( /^\s*</.test(work) ) {
      // tag of some sort
      var rr = {};
      temp_buff = get_tag_contents(work);
      rr.tt = tag_type(temp_buff,self.options.SlashIsDirectory===undefined?false:self.options.SlashIsDirectory);

      if( rr.tt == 'closing' )
        temp_buff = temp_buff.slice(1);

      rr.tn = tag_name(temp_buff);

      temp_buff = kill_ws(temp_buff.replace(rr.tn,''));

      if( temp_buff.slice(0,2) == '""' )
        temp_buff = temp_buff.slice(2).trim();

      if( rr.tt == 'selfclosing' && temp_buff.slice(-1) == '/' )
        temp_buff = temp_buff.slice(0,-1);

      if( /^\".*\"$/.test(temp_buff) ) // we've still got a string left
        rr.td = get_string(temp_buff);
      else
        rr.td = kill_ws(temp_buff);

      if( rr.td === "" || /^\s+$/.test(rr.td) )
        rr.td = undefined;

      ms.push( { type: rr.tt, value: { name: rr.tn, data: rr.td } } );
    } else {
      // key-value pair. This is the least tricky one.
      // 'guess' or 'whitespace' when there is no equalsign
      // present will split at the first piece of whitespace
      // regardless of whether the opening starts with any
      // form of quote
      var rs;
      work = get_data_no_comment(work);
      if( work.slice(-1) == '\\' &&
          work.slice(-2) != '\\\\' ) {
        rs = read_continued_line(wb,bpos);
        work = rs[0];
        bpos = rs[1];
      }

      if( temp_buff === "" )
        temp_buff = work.trimLeft();

      temp_buff = temp_buff.trimLeft();

      rs = do_split( temp_buff, self.options.SplitPolicy, self.options.SplitDelimiter );

      if( rs[0].toLowerCase() == 'include' &&
          self.options.UseApacheInclude ) {
        if( rs[1].trim()[0] == '"' ) {
          ms.push( { type: 'include', value: get_string(rs[1].trim()) } );
        } else {
          ms.push( { type: 'include', value: rs[1].trim() } );
        }
      } else {
        if( rs[1] !== undefined &&
            rs[1].trim() !== "" ) {
          // properly do this
          temp_buff = rs[1].trim();

          if( temp_buff[0] == '=' ) {
            temp_buff = temp_buff.slice(1).trimLeft();
          }

          temp_buff = temp_buff.trim();
          if( temp_buff[0] == '"' )
            temp_buff = get_string(temp_buff);

          ms.push( { type: 'keyvalue', value: { key: rs[0].trim(), value: temp_buff } } );
        } else {
          ms.push( { type: 'keyvalue', value: { key: rs[0].trim(), value: undefined } } );
        }
      }
    }
      bpos++;
  }
  ms.push( { type: 'includeend' } );
  this.token_stack = ms.concat(this.token_stack);
};

tokenizer.prototype.process = function( data ) {
  var rv = [];
  var pos = 0;

  var temp = data;

  var current = temp[pos];

  while( pos < temp.length ) {
    if( !(/^\s*\/\/.*$/.test(current)) &&
        !(/^\s+$/.test(current)) &&
        !(/^\s*(?:#.*)?$/.test(current)) &&
          current !== '' ) {
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

  while( bpos < wb.length ) {
    var work = kill_ws(wb[bpos]);
    var temp_buff = "";
    if( /<</.test(work) && !(/>>/.test(work))) {
      // heredoc
      var d = read_heredoc(wb,bpos);
      if( d === undefined )
        return;

      bpos = d[0];
      self.token_stack.push( { type: 'keyvalue', value: { key: d[1].name, value: d[1].value }});
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
      rr.tt = tag_type(temp_buff,self.options.SlashIsDirectory===undefined?false:self.options.SlashIsDirectory);

      if( rr.tt == 'closing' )
        temp_buff = temp_buff.slice(1);

      rr.tn = tag_name(temp_buff);

      temp_buff = kill_ws(temp_buff.replace(rr.tn,''));

      if( temp_buff.slice(0,2) == '""' )
        temp_buff = temp_buff.slice(2).trim();

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
      if( work.slice(-1) == '\\' &&
          work.slice(-2) != '\\\\' ) {
        rs = read_continued_line(wb,bpos);
        work = rs[0];
        bpos = rs[1];
      }

      if( temp_buff === "" )
        temp_buff = work.trimLeft();

      temp_buff = temp_buff.trimLeft();

      rs = do_split( temp_buff, self.options.SplitPolicy, self.options.SplitDelimiter );

      if( rs[0].toLowerCase() == 'include' &&
          self.options.UseApacheInclude ) {
        if( rs[1].trim()[0] == '"' ) {
          self.token_stack.push( { type: 'include', value: get_string(rs[1].trim()) } );
        } else {
          self.token_stack.push( { type: 'include', value: rs[1].trim() } );
        }
      } else {
        if( rs[1] !== undefined &&
            rs[1].trim() !== "" ) {
          // properly do this
          temp_buff = rs[1].trim();

          if( temp_buff[0] == '=' ) {
            temp_buff = temp_buff.slice(1).trimLeft();
          }

          temp_buff = temp_buff.trim();
          if( temp_buff[0] == '"' )
            temp_buff = get_string(temp_buff);

          self.token_stack.push( { type: 'keyvalue', value: { key: rs[0].trim(), value: temp_buff } } );
        } else {
          self.token_stack.push( { type: 'keyvalue', value: { key: rs[0].trim(), value: undefined } } );
        }
      }
    }
    bpos++;
  }
};

tokenizer.prototype.get_token = function() {
  var self = this;
  if( self.token_stack.length === 0 ) {
    return { type: 'end' };
  }

  var cl = this.token_stack.shift();
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
    case 'includeend':
    rv = cl;
    break;
  }

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
    case 'includeend':
    case 'end':
    break;
    case 'includereq':
    rv.pattern = work.pattern;
    break;
    default:
    console.log(util.inspect(work));
    throw new Error('unknown data returned from get_token!');
  }

  if( work.type != 'end' &&
    work.type != 'includeend' )
    self.emit( work.type, rv );
  else if( work.type == 'includeend' )
    self.emit( 'includeend' );
  else
    self.emit( 'end' );
};

module.exports = tokenizer;
