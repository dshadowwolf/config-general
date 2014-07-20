var parser = require('./cg_parser');
var pu = require('./proxy_helpers');
var fs = require('fs');
var mu = require('./my-utils');
var ex = require('./extended');
var console = require('console');
var util = require('util');

var def_opts = {
  'LowerCaseNames': false,
  'UseApacheInclude': false,
  'AllowMultiOptions': true,
  'IncludeRelative': false,
  'IncludeDirectories': false,
  'IncludeGlob': false,
  'IncludeAgain': false,
  'MergeDuplicateBlocks': false,
  'MergeDuplicateOptions': false,
  'AutoTrue': false,
  'InterPolateVars': false,
  'InterPolateEnv': false,
  'AllowSingleQuoteInterpolation': false,
  'StrictVars': false,
  'SplitPolicy': 'guess',
  'CComments': true,
  'SlashIsDirectory': false
};

function mparse( opts ) {
  var ll_opts = def_opts;
  this.options = {};

  var self = this;
  Object.keys(opts).forEach( function( e, i, o ) {
    var opt_val = opts[e];
    var opt_name = e;

    switch(opt_name) {
      case 'LowerCaseNames':
      case 'UseApacheInclude':
      case 'AllowMultiOptions':
      case 'IncludeRelative':
      case 'IncludeDirectories':
      case 'IncludeGlob':
      case 'IncludeAgain':
      case 'ConfigPath':
      case 'MergeDuplicateBlocks':
      case 'MergeDuplicateOptions':
      case 'AutoTrue':
      case 'FlagBits':
      case 'DefaultConfig':
      case 'Tie':
      case 'InterPolateVars':
      case 'InterPolateEnv':
      case 'AllowSingleQuoteInterpolation':
      case 'StrictVars':
      case 'SplitPolicy':
      case 'SplitDelimiter':
      case 'CComments':
      case 'SlashIsDirectory':
      case 'SaveSorted':
      case 'NormalizeBlock':
      case 'NormalizeOption':
      case 'NormalizeValue':
      case 'UseApacheInclude':
      case 'String':
      ll_opts[opt_name] = opt_val;
      self.options[opt_name] = opt_val;
      break;
      case 'ConfigFile':
      case 'ConfigHash':
      ll_opts[opt_name] = opt_val;
      self.options[opt_name] = opt_val;
      break;
      case 'ApacheCompatible':
      ll_opts.UseApacheInclude = opt_val;
      ll_opts.IncludeRelative = opt_val;
      ll_opts.IncludeDirectories = opt_val;
      ll_opts.IncludeGlob = opt_val;
      ll_opts.SlashIsDirectory = opt_val;
      ll_opts.SplitPolicy = 'whitespace';
      ll_opts.CComments = false;
      break;
      default:
      self.options[opt_name] = opt_val;
    }
  });

  this.parser = {};
  this.file = opts.ConfigFile;

  this.data = {};

  if( this.options.ExtendedAccess !== undefined &&
      this.options.ExtendedAccess === true )
    ex.extended(this);

  if( this.options.ConfigHash )
    this.data = this.options.ConfigHash;

  if( this.options.String ||
      this.options.ConfigFile ) {
    this.parser = new parser(ll_opts);

    try {
      this.parser.parse( function(d) {
        Object.keys(d).forEach( function( e,i,o ) {
          self.data[e] = d[e];
        });
      });
    } catch(e) {
      throw e;
    }
  }
}

mparse.prototype.files = function() {
  return this.parser.get_files();
};

mparse.prototype.getall = function() {
  return this.data;
};

mparse.prototype.get_indent = function(l) {
  if( l === 0 )
    return '';

  var r = [];

  for( var i = 0; i < l; i++ )
    r.push('');

  var z = r.join(' ');
  return z;
};

mparse.prototype.write_keyvalue = function( indent, buffer, key, value ) {
  if( value.trim() != value )
    value = '"'+value+'"';

  if( /\n/g.test(value) ) {
    buffer.push(this.get_indent(indent)+key.trim()+' <<EOF');
    buffer.push(value);
    buffer.push('EOF');
  } else {
    if( this.options.StoreDelimiter ) {
      buffer.push(this.get_indent(indent)+key.trim()+''+this.options.StoreDelimiter+''+value);
    } else {
      buffer.push(this.get_indent(indent)+key.trim()+' '+value);
    }
  }
};

mparse.prototype.write_array = function( indent, buffer, name, arr ) {
  var self = this;
  arr.forEach( function( el, ind, ar ) {
    var tobj = el;
    if( Array.isArray(tobj) )
      self.write_array(indent+2,buffer,el,tobj);
    else if( 'object' == typeof tobj ) {
      if(tobj.hasOwnProperty("subobjaretags")) {
        var nn = Object.keys(tobj)[0];
        buffer.push(self.get_indent(indent)+'<'+name+' '+nn+'>');
        if( 'object' == typeof tobj[nn] )
          self.write_object_noheader(indent+2,buffer,nn,tobj[nn]);
        else
          self.write_object_noheader(indent+2,buffer,nn,tobj);
        buffer.push(self.get_indent(indent)+'</'+name+'>');
      } else {
        self.write_object(indent+2,buffer,name,tobj);
      }
    } else
      self.write_keyvalue(indent+2,buffer,name,tobj);
  });
};

mparse.prototype.write_object_noheader = function( indent, buffer, name, object ) {
  var self = this;

  Object.keys(object).forEach( function(el,ind,ar) {
    var tobj = object[el];
    if( Array.isArray(tobj) )
      self.write_array(indent+2,buffer,el,tobj);
    else if( 'object' == typeof tobj )
      self.write_object(indent+2,buffer,el,tobj);
    else
      self.write_keyvalue(indent+2,buffer,el,tobj);
  });
};

mparse.prototype.write_object = function( indent, buffer, name, object ) {
  var self = this;
  buffer.push(this.get_indent(indent)+'<'+name+'>');
  Object.keys(object).forEach( function(el,ind,ar) {
    var tobj = object[el];
    if( Array.isArray(tobj) )
      self.write_array(indent+2,buffer,el,tobj);
    else if( 'object' == typeof tobj )
      self.write_object(indent+2,buffer,el,tobj);
    else
      self.write_keyvalue(indent+2,buffer,el,tobj);
  });
  buffer.push(this.get_indent(indent)+'</'+name+'>');
};

mparse.prototype.save_file = function( filename ) {
  var self = this;
  var buffer = [];

  Object.keys(this.data).forEach( function( elem, ind, arr ) {
    var val = self.data[elem];
    if( 'number' == typeof val ||
        'boolean' == typeof val )
      val = val.toString();

    if( 'string' == typeof val )
      self.write_keyvalue(0,buffer,elem,val);
    else if( Array.isArray(val) )
      self.write_array(0,buffer,elem,val);
    else if( 'object' == typeof val )
        self.write_object(0,buffer,elem,val);
    else
      throw new Error("Don't know how to handle item of type "+typeof val+" in a configuration store.");
  });

  buffer.push('');

  fs.writeFileSync( filename, buffer.join("\n") );
};

function objInt(parent,name) {
  this.parent = parent;
  this.name = name;
  this.data = undefined;
  this.options = parent.options;

  if( this.parent.data === undefined )
    throw new Error('data handling error!');

  if( !(name in this.parent.data) )
      this.parent.data[name] = {};

  if( 'object' != typeof this.parent.data[name] )
    this.data = this.parent.data[name];
  else
    this.data = new Object(this.parent.data[name]);

  if( this.options.ExtendedAccess !== undefined &&
      this.options.ExtendedAccess )
    ex.extended(this);

  return this;
}

objInt.prototype = Object.create(mparse.prototype);

mparse.prototype.obj = function(name) {
  var x = new objInt(this, name);
  var h = pu.handlerMakerMparse(x);

  if( 'ExtendedAccess' in this.options &&
      this.options.ExtendedAccess &&
      'object' == typeof x.data )
    return Proxy.create(h);
  else
    return x;
};

module.exports.parser = mparse;
