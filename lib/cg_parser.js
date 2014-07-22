/*
 * Still needs more work to be fully compliant with
 * Perl's Config::General module, but it now has includes
 * and variables. In fact, I've gone beyond Config::General
 * and allow de-referencing of values in arrays that are in
 * the config data.
 *
 * Variable handling is not as versatile as Config::Generals
 * yet, nor do all the rules around them match. That will be
 * fixed.
 */

var fs = require('fs'),
    console = require('console'),
    util = require('util'),
    glob = require('glob'),
    tokens = require('./token_source.js'),
    mu = require('./my-utils'),
    iv = require('./interp_vars'),
    futil = require('./file-utils'),
    path = require('path'),
    symtab = require('./symtab'),
    fu = require('./file-utils');

var tok_opts_base = {
  'SplitPolicy': 'guess',
  'CComments': true,
  'SlashIsDirectory': false,
  'UseApacheInclude': false
};

var includes_tracking = {};


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
  'SlashIsDirectory': false,
  'ForceArray': false
};


function cfgparser(opts,ki) {
  this.options = def_opts;
  var self = this;
  var tokenizer_options = tok_opts_base;

  Object.keys(opts).forEach( function( e, i, o ) {
    switch(e) {
      case 'SplitPolicy':
      case 'CComments':
      case 'SlashIsDirectory':
      case 'SplitDelimiter':
      case 'UseApacheInclude':
      case 'String':
      tokenizer_options[e] = opts[e];
      break;
      case 'ConfigFile':
      tokenizer_options[e] = opts[e];
      self.options[e] = opts[e];
      break;
      case 'DefaultConfig':
      if( typeof opts[e] == 'string' ) {
        tokenizer_options[e] = opts[e];
      }
      self.options[e] = opts[e];
      break;
      default:
      self.options[e] = opts[e];
    }
  });

  this.known_includes = ki!==undefined?ki:{};
  this.symbols = new symtab(undefined,'toplevel');
  this.blocks = [];
  this.curblock = {};
  this.bns = [];
  this.cbn = "";
  this.end_run = false;
  this.token_source = new tokens(tokenizer_options);
  this.end_cb = null;
  this.lower_case = false;
  this.var_base = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/g;
  this.files = [];
  this.include_stack = [];
  this.filename = this.options.ConfigFile?this.options.ConfigFile:'unknown';

  if( this.options.ConfigFile )
    this.files.push(this.options.ConfigFile);

  if( self.options.InterPolateVars ||
      self.options.InterPolateEnv  ) {
    this.get_var_value = iv.get_value;
    this.interpolate = iv.interp;
  } else if( self.options.InterPolateVars === false &&
             self.options.InterPolateEnv === false ) {
    this.interpolate = function(xx) { return xx; };
    if( this.get_var_value !== undefined )
      delete this.get_var_value;
  }else {
    this.interpolate = function(xx) { return xx; };
  }

  if( this.options.DefaultConfig !== undefined &&
      'object' == typeof this.options.DefaultConfig ) {
    this.curblock = {};
    this.bns = [];
    this.cbn = "";
    this.processDefault();
  }

  this.token_source.on('includereq', function(data) {
    var fn = self.interpolate(data.pattern.toString());

    var flist = [];
    var tlist;
    var extra;
    var base_name;

    if( self.options.IncludeRelative ) {
      if( self.include_stack.length > 0 )
        base_name = self.include_stack.slice(-1)[0];
      else
        base_name = self.filename;

      futil.getRelative(base_name,self.options.ConfigPath).forEach(
        function(e,i,a) {
          flist.push( e + "/" + fn );
        });
    } else {
      flist = [ fn ];
    }

    if( self.options.IncludeDirectories ) {
      tlist = flist.filter( function(el) { return futil.isDirectory(el); } );
      extra = flist.filter( function( e ) { return !futil.isDirectory(e); } );
      flist = extra;
      flist = flist.concat( futil.getDirectories(tlist) );
      // we don't recurse down the tree at all (I don't think, at least)
      flist = flist.filter( function( e ) { return !futil.isDirectory(e); } );
    }

    if( self.options.IncludeGlob ) {
      tlist = flist.filter( function(el) { return futil.isGlob(el); });
      extra = flist.filter( function(el) { return !(futil.isGlob(el)); });
      flist = extra;

      tlist.forEach( function( ele, inst, arr ) {
          flist = flist.concat(glob.sync(ele));
      });
    }

    if( !(self.options.IncludeAgain )) {
      flist = flist.filter( function(e) {
                return (self.known_includes[e] === undefined);
              });
    }


    if( Object.keys(includes_tracking).length > 0 )
      flist = flist.filter( function(e) {
                if( includes_tracking[e] )
                  if( includes_tracking[e][self.filename] === undefined )
                    return false;
                return true;
              });

    flist.forEach( function( e, i, a ) {
      self.files.push(e);
      self.include_stack.push(e);
      self.known_includes[e] = true;
      if( includes_tracking[self.filename] === undefined )
        includes_tracking[self.filename] = {};

      includes_tracking[self.filename][e] = true;

      if( fs.existsSync(e) ) {
        var p = fu.getFile( e ).split("\n");
        self.token_source.tokenize_and_insert(p);
      }
    });
  });

  this.token_source.on('includeend', function(data) {
    self.include_stack.pop();
  });

  this.token_source.on('selfclose', function(data) {
    self.newBlock(data);
    self.closeBlock(data.name);
  } );

  this.token_source.on('tagopen', function(data) {
    self.newBlock(data);
  } );

  this.token_source.on('tagclose', function(data) {
    self.closeBlock(data);
  } );

  this.token_source.on('keyvalue', function(data) {
    var key = self.maybeLower(self.interpolate(data.name));
    var value = self.interpolate(data.value);

    if( /^\\[.*\\]$/.test(value) &&
        self.options.ForceArray !== true ) {
      if( value.split(',').length > 1 )
        value = value.slice(1,-1).split(',')[0];
      else
        value = value.slice(1,-1);
    } else if( /^\\[.*\\]$/.test(value) &&
        self.options.ForceArray === true ) {
      if( value.split(',').length > 1 ) {
        value = [ value.slice(1,-1).split(',')[0] ];
      } else {
        value = [ value.slice(1,-1) ];
      }
    }

    self.symbols[key] = value;

    self.putValue(key,value);
  } );

  this.token_source.on('end', function() {
    self.end_run = true;
    self.end_cb( self.curblock );
  });

}

cfgparser.prototype.get_files = function() {
  this.files = this.files.filter( function(elem, pos,self) {
                 return self.indexOf(elem) == pos;
               });
  return this.files;
};

cfgparser.prototype.pushblock = function() {
  if( this.curblock != {} ) {
    this.blocks.push( this.curblock );
    this.bns.push( this.cbn );
    this.curblock = {};
    this.cbn = "";
  }
};

cfgparser.prototype.processDefault = function(optional) {
  var work, self = this;
  if( optional !== undefined )
    work = optional;
  else
    work = this.options.DefaultConfig;

  Object.keys(work).forEach( function( e, i, a ) {
    if( Array.isArray(work[e]) ||
        'object' != typeof work[e] ) {
      self.putValue(e,work[e]);
    } else {
      self.newBlock({ name: e, specname: undefined });
      if( self.symbols._state.name != e )
        self.newScope( e );
      self.processDefault(work[e]);
      if( self.symbols._state.name != e )
        self.exitScope();
      self.closeBlock(e);
    }
  });
};

cfgparser.prototype.popblock = function() {
  if( this.blocks.length > 0 ) {
    this.curblock = this.blocks.pop();
    this.cbn = this.bns.pop();
  }
};

cfgparser.prototype.maybeLower = function(s) {
  if( this.options.LowerCaseNames )
    return s.toLowerCase();

  return s;
};

cfgparser.prototype.newScope = function(n) {
  var t;
  if( this.symbols.has_scope(n) &&
      this.options.MergeDuplicateBlocks === true )
    t = this.symbols.get_scope(n);
  else
    t = this.symbols.new_scope(n);

  this.symbols = t;
};

cfgparser.prototype.exitScope = function() {
  this.symbols = this.symbols.exit_scope();
};

cfgparser.prototype.newBlock = function(d) {
  var name = this.interpolate(d.name);
  this.pushblock();

  this.newScope(name);

  if( d.specname !== undefined ) {
    this.curblock.sn = this.maybeLower(this.interpolate(d.specname));
    this.newScope(this.curblock.sn);
  }

  this.cbn = name;
};

cfgparser.prototype.closeBlock = function(d) {
  var work = this.interpolate(d);

  this.exitScope();

  if( work.toLowerCase() != this.cbn.toLowerCase() ) {
    throw new Error('mis-nested blocks');
  }

  if( this.curblock.sn !== undefined ) {
    var nb = new Object(this.curblock);
    var nbb = {};

    nbb[nb.sn] = nb;
    delete nb.sn;
    this.curblock = nbb;
    Object.defineProperty( this.curblock, "subobjaretags",{
      value: true,
      enumerable: false,
      configuraable: true,
      writable: false
    });
    this.exitScope();
  }

  var temp = this.curblock;
  if( this.curblock.hasOwnProperty("subobjaretags") &&
      !temp.hasOwnProperty("subobjaretags") )
    Object.defineProperty( temp, "subobjaretags",{
      value: true,
      enumerable: false,
      configuraable: true,
      writable: false
    });

  this.popblock();
  this.putBlock(work, temp);
};

cfgparser.prototype.maybeMerge = function( key, value ) {
  if( this.options.MergeDuplicateBlocks ) {
    if( this.curblock[key] !== undefined ) {
      Object.keys(value).forEach( function( e, i, a ) {
        this.putValue(this.curblock[key][e],value[e]);
      });
    } else {
      this.curblock[key] = value;
    }
    return true;
  }
  return false;
};

function doFlagBits(key,value, flags) {
  var bits = flags[key];
  var hold = {};

  value.split('|').forEach( function( e, i, a ) {
    Object.keys(bits).forEach( function(el,ins,arr) {
      if( e.trim() == el )
        hold[e.trim()] = bits[el];
    });
  });

  Object.keys(bits).forEach( function( e, i, a ) {
    if( hold[e] === undefined )
      hold[e] = undefined;
  });

  return hold;
}

cfgparser.prototype.putBlock = function(name, block) {
  if( this.curblock[name] !== undefined ) {
    var self = this;
    if( 'object' != typeof this.curblock[name] )
      throw new Error("Attempt to write a block over a non-block value");

    Object.keys(block).forEach( function(e, i, a) {
      self.curblock[name][e] = block[e];
      if( block[e].hasOwnProperty("subobjaretags") )
        Object.defineProperty( self.curblock[name][e], "subobjaretags",
                               block[e].getOwnPropertyDescriptor("subobjaretags") );
    });
  } else {
    this.curblock[name] = block;
  }
};

function autotrue(value) {
  if( 'string' != typeof value )
    value = value.toString();

  switch(value.toLowerCase()) {
    case 'yes':
    case 'on':
    case 'true':
    case '1':
    return true;
    case 'no':
    case 'off':
    case 'false':
    case '0':
    return false;
    default:
    return value;
  }
}

function strip_quoting(val) {
  return val.replace(/(\\)/g, function(match) { return match.slice(1) } );
}

// Need to implement the 'FlagBits' option here
cfgparser.prototype.putValue = function(key,value) {
  var workval = value;
  if( this.options.FlagBits !== undefined ) {
    if( key in this.options.FlagBits ) {
      var temp = doFlagBits(key,value,this.options.FlagBits);
      workval = {};
      Object.keys(temp).forEach( function(e,i,a) {
        workval[e] = temp[e];
      });
    }
  }

  var asdf = [];

  if( this.options.AutoTrue === true &&
    'object' != typeof workval )
    workval = autotrue(workval);

  if( 'string' == typeof workval &&
    /\\/.test(workval) )
    workval = strip_quoting(workval);

  if( this.curblock[key] !== undefined &&
      ('object' == typeof this.curblock[key] &&
       !Array.isArray(this.curblock[key])) )
    throw new Error('Attempt to write a scalar over a block');

  if( this.options.AllowMultiOptions ) {
    if( this.curblock[key] !== undefined ) {
        if( !(Array.isArray(this.curblock[key])) ) {
          if( 'object' == typeof workval ) {
            if( !(this.maybeMerge( key, workval )) ) {
              asdf.push(this.curblock[key]);
              asdf.push(workval);
              this.curblock[key] = asdf;
            }
          } else if( 'object' != typeof workval &&
                     this.options.MergeDuplicateOptions ) {
            this.curblock[key] = workval;
            this.symbols.set_value(key, workval);
          } else {
            asdf.push(this.curblock[key]);
            asdf.push(workval);
            this.curblock[key] = asdf;
            this.symbols.set_value(key, asdf);
          }
        } else {
          this.curblock[key].push(workval);
          this.symbols.set_value(key, workval);
        }
    } else {
      this.curblock[key] = workval;
      this.symbols.set_value(key, workval);
    }
  } else {
    if( this.curblock[key] !== undefined ) {
      if( 'object' == typeof workval ) {
        if( !(this.maybeMerge(key, workval)) ) {
          this.curblock[key] = workval;
        }
      } else {
        this.curblock[key] = workval;
        this.symbols.set_value(key, workval);
      }
    } else {
      this.curblock[key] = workval;
      this.symbols.set_value(key, workval);
    }
  }
};


cfgparser.prototype.parse = function( cb ) {
  var self = this;
  self.end_cb = cb;

  while( !self.end_run ) {
    self.token_source.next();
  }
};

module.exports = cfgparser;
