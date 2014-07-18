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
    path = require('path');

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
  'UseApacheInclude': false,
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
  this.symbols = [];
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
  this.filename = this.options.ConfigFile?this.options.ConfigFile:'unknown';

  if( this.options.ConfigFile )
    this.files.push(this.options.ConfigFile);

  var self = this;

  if( self.options.InterPolateVars ||
      self.options.InterPolateEnv  ) {
    this.get_var_value = iv.get_value;
    this.interpolate = iv.interp;
  } else if( self.options.InterPolateVars == false &&
             self.options.InterPolateEnv == false ) {
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

    var flist;
    var tlist;
    var extra;

    if( self.options.IncludeRelative ) {
      futil.getRelative(self.filename,self.options.ConfigPath).forEach(
        function(e,i,a) {
          flist.push( e + "/" + fn );
        });
    } else {
      flist = [ fn ];
    }

    if( self.options.IncludeDirectories ) {
      tlist = flist.filter( function(el) { return futil.isDir(el); } );
      extra = flist.filter( function( e ) { return !futil.isDir(e); } );
      flist = extra;
      flist = flist.concat( futil.getDirectories(tlist) );
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
      self.known_includes[e] = true;
      if( includes_tracking[self.filename] === undefined )
        includes_tracking[self.filename] = {};

      includes_tracking[self.filename][e] = true;

      var t = self.options;
      t.ConfigFile = e;

      // we're losing data somewhere.
      // In the current "last converted" test we're
      // losing data from a second-level of includes
      // I think that we need to make sure the data
      // gets passed back up the line properly.
      // one idea that keeps coming back to me is to
      // insert the data from a new file into the
      // existing token-stream.
      // Array.prototype.splice combined with the
      // results of passing the new file through
      // process and a modified version of build_stack
      // that pushes onto a passed-in stack instead of
      // a global one...
      var p = fs.readFileSync( t.ConfigFile, 'utf8' ).split("\n");
      self.token_source.tokenize_and_insert(p);
    });
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
      self.symbols[e] = work[e];
      self.putValue(e,work[e]);
    } else {
      self.newBlock({ name: e, specname: undefined });
      self.processDefault(work[e]);
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

cfgparser.prototype.newBlock = function(d) {
  var name = this.interpolate(d.name);
  this.pushblock();
  if( d.specname !== undefined )
    this.curblock.sn = this.maybeLower(this.interpolate(d.specname));

  this.cbn = name;
};

cfgparser.prototype.closeBlock = function(d) {
  var work = this.interpolate(d);

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

function doFlagBits(key,value) {
  var bits = this.options.FlagBits[key];
  var hold = {};

  value.split('|').forEach( function( e, i, a ) {
    if( e in bits )
      hold[e] = bits[e];
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

// Need to implement the 'FlagBits' option here
cfgparser.prototype.putValue = function(key,value) {
  var workval = value;
  if( this.options.FlagBits !== undefined ) {
    if( key in this.options.FlagBits ) {
      workval = doFlagBits(key,value);
    }
  }

  this.symbols[key] = workval;
  var asdf = [];
  if( 'string' == typeof workval )
    workval = this.interpolate(workval);

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
          } else {
            asdf.push(this.curblock[key]);
            asdf.push(workval);
            this.curblock[key] = asdf;
          }
        } else {
          this.curblock[key].push(workval);
        }
    } else {
      this.curblock[key] = workval;
    }
  } else {
    if( this.curblock[key] !== undefined ) {
      if( 'object' == typeof workval ) {
        if( !(this.maybeMerge(key, workval)) ) {
          this.curblock[key] = workval;
        }
      } else {
        this.curblock[key] = workval;
      }
    } else {
      this.curblock[key] = workval;
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
