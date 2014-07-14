var parser = require('./cg_parser');
var pu = require('./proxy_helpers');
var fs = require('fs');
var mu = require('./my-utils');

function mparse( filename ) {
  this.parser = new parser();
  this.file = filename;
  this.options = {
    LowerCaseNames: false
  };

  this.data = {};
};

mparse.prototype.open = function() {
  var f = this.file;
  if( f === undefined ) {
    throw new Error( 'no file to open!' );
  }
  this.parser.open(f);
};

mparse.prototype.set_option = function(name,value) {
  switch(name) {
    case "ConfigHash":
    this.parser.set_option(name,value);
    this.options[name] = true;
    break;
    default:
    this.options[name] = value;
  }
};

mparse.prototype.getall = function() {
  return this.data;
};

mparse.prototype.save = function( filename ) {
  var fd;// = fs.openSync( filename, 'w' );
  var od = [];

  var self = this;
  var indent_level = 0;

  function get_indent() {
    if( indent_level == 0 )
      return ''

    var r = [];

    for( var i = 0; i < indent_level; i++ )
      r.push('')

    var z = r.join(' ')
    return ((z.length == indent_level-1)?z+" ":z);
  }

  function special_dump(name,obj) {
    var topen = '<'+name, tclose = '</'+name+'>';

    Object.keys(obj).forEach( function(el) {
      var to = topen+' '+el+'>';
      od.push(get_indent()+to);
      dump_sub(obj[el]);
      od.push(get_indent()+tclose);
    });
  }

  function dump_sub( obj ) {
    indent_level += 2
    Object.keys(obj).forEach( function( elem, ind, arr ) {
      var val = obj[elem];
    if( 'number' == typeof(val) )
      val = val.toString();
      if( 'string' != typeof val && !Array.isArray(val) ) {
        if( val.hasOwnProperty('subobjaretags') ) {
          special_dump(elem,val);
        } else {
          od.push(get_indent()+'<'+elem+'>');
          dump_sub(val);
          if( od.slice(-1) != '</'+elem+'>' )
            od.push(get_indent()+'</'+elem+'>');
        }
      } else if( Array.isArray(val) && 'object' != typeof val[0]) {
        if( val.length > 1 )
          val.forEach( function(e) {
            od.push(get_indent()+elem+" "+e)
          });
        else if( val.length == 1 )
          od.push(get_indent()+elem+" [ "+ val[0] + " ]" );
        else
          od.push(get_indent()+elem+" []");
      } else if( Array.isArray(val) && 'object' == typeof val[0]) {
        od.push('<'+elem+'>');
        val.forEach( function( el, i, ar ) {
          dump_sub(el);
        });
        od.push('</'+elem+'>');
      } else if( val.match( /(?:\r\n|\n\r|\n)/m ) ) {
        od.push(elem+" <<EOF")
        od.push(val)
        od.push("EOF")
      } else {
      if( val[0] == '"' || val[0] == '\'' )
        if( /(["'])?(?:\\\1|.)*?\1/.test(val) )
          val = val.replace( /((["'])?(?:\\\2|.)*?\2)/g, "\\$&" );

        if( val[0] == '\\' )
          val = val.slice(1);

        if( val.trim().slice(-1) == '\\' )
          val = val.trim().slice(0,-1);

        od.push(get_indent()+elem+" "+val);
      }
    });
    indent_level -= 2
  };

  Object.keys(this.data).forEach( function( elem, ind, arr ) {
    var val = self.data[elem];

    if( 'number' == typeof(val) )
      val = val.toString();

    if( 'string' != typeof val && !Array.isArray(val) ) {
      if( val.hasOwnProperty('subobjaretags') ) {
        special_dump(elem,val);
      } else {
        od.push('<'+elem+'>');
        dump_sub(val);
        if( od.slice(-1) != '</'+elem+'>' )
          od.push('</'+elem+'>');
      }
    } else if( Array.isArray(val) && 'object' != typeof val[0]) {
        if( val.length > 1 )
          val.forEach( function(e) {
            od.push(elem+" "+e)
          });
        else if( val.length == 1 )
          od.push(elem+" [ "+ val[0] + " ]" );
        else
          od.push(elem+" []");
    } else if( Array.isArray(val) && 'object' == typeof val[0]) {
      od.push('<'+elem+'>');
      val.forEach( function( el, i, ar ) {
        dump_sub(el);
      });
      od.push('</'+elem+'>');
    } else if( val.match( /(?:\r\n|\n\r|\n)/m ) ) {
      od.push(elem+" <<EOF")
      od.push(val)
      od.push("EOF")
    } else {
      if( val[0] == '"' || val[0] == '\'' )
        if( /(["'])?(?:\\\1|.)*?\1/.test(val) )
          val = val.replace( /((["'])?(?:\\\2|.)*?\2)/g, "\\$&" );

      if( val[0] == '\\' )
        val = val.slice(1);

      if( val.trim().slice(-1) == '\\' )
        val = val.trim().slice(0,-1);

        od.push(elem+" "+val);
      }
  });

  fs.writeFileSync( filename, od.join('\n') );
};

mparse.prototype.parse = function( cb ) {
  var res;
  this.parser.setLowerCaseNames( this.options.LowerCaseNames );

  try {
    this.parser.parse( function(d) { res = d; } );
  } catch(e) {
      throw e;
  }
  this.data = res;
  return true;
};

function objInt(parent,name) {
  this.parent = parent;
  this.name = name;
  this.data = undefined;

  if( this.parent.data === undefined )
    throw new Error('data handling error!');

  if( !(name in this.parent.data) )
      this.parent.data[name] = {};

  this.data = new Object(this.parent.data[name]);

  return this;
};

objInt.prototype = Object.create(mparse.prototype);

mparse.prototype.obj = function(name) {
  var x = new objInt(this, name);
  var h = pu.handlerMakerMparse(x);

  return Proxy.create(h);
};

mparse.prototype.keys = function(name) {
  var rv = [], x = this.data[name];

  if( 'string' != typeof x &&
      'number' != typeof x &&
      !Array.isArray(x) &&
      x !== undefined )
    Object.keys(x).forEach( function(e,i,a) {
      rv.push(e)
    });

  return rv;
};

mparse.prototype.is_hash = function(name) {
  return ('object' == typeof this.data[name] &&
          !Array.isArray(this.data[name]) &&
         this.data[name] !== undefined );
};

mparse.prototype.is_array = function(name) {
  return (Array.isArray(this.data[name]) &&
         this.data[name] !== undefined );
}

// I have the check for 'function' just to be pedantic
mparse.prototype.is_scalar = function(name) {
  return ('object' != typeof this.data[name] &&
          'function' != typeof this.data[name] &&
         this.data[name] !== undefined );
};

mparse.prototype.exists = function(name) {
  return (this.data[name] !== undefined );
};

mparse.prototype.value = function(name) {
  if( this.exists(name) ) {
    if( !this.is_scalar(name) )
      return this.obj(name);
    else
      return this.data[name];
  }
  return undefined;
};

mparse.prototype.hash = function(name) {
  if( this.is_hash(name) )
    return mu.copy(this.data[name]);
  else
    throw new TypeError('key '+name+' is not a hash!');
}

mparse.prototype.array = function(name) {
  if( this.is_array(name) )
    return mu.copy(this.data[name]);
  else
    throw new TypeError('key '+name+' is not an array!');
}

mparse.prototype.scalar = function(name) {
  if( this.is_scalar(name) )
    return new String(this.data[name]);
  else
    return new String(name);
}

mparse.prototype.delete = function(name) {
  if( name in this.data )
    delete this.data[name]
  else
    throw new Error('delete called for non-existant key')
}

module.exports = mparse;
