var parser = require('./lib/parser_wrap'),
    console = require('console'),
    fs = require('fs'),
    util = require('util'),
    tc = require('./lib/type_conv'),
    pu = require('./lib/proxy_helpers');

module.exports.quick_parse = function( filename, options, cb ) {
  var p = new parser(filename);
  p.open();
  if( options !== undefined ) {
    for( var k in Object.keys(options) ) {
      var key = Object.keys(options)[k];
      var val = options[key];

      p.set_option(key,val);
    }
  }

  var res;

  p.parse( function( err, data ) {
    if( err !== undefined ) {
      throw err;
    }

    res = data;
  });

  return res;
};


// NOTE: the strangeness of this (Proxy) constructor returning
// a reference to itself if passed no filename is becaue of
// how the Perl version works.
function cons() {
  var fn, opts = {}, parseFile = true;
  var argv = arguments[0];
  if( argv == undefined )
    return undefined;
  else if( 'string' == typeof argv )
    fn = argv;
  else
    Object.keys(argv).forEach( function(ind,x,arr) {
      switch( ind ) {
        case 'ConfigFile':
        fn = argv[ind];
        break;
        default:
        opts[ind] = argv[ind];
      }
    });

/*  if( fn === undefined )
    return this; */

  var kl = Object.keys(opts);


  if( fn === undefined &&
      !("ConfigFile" in kl) ) {
    parseFile = false;
  }

  var p = new parser.parser(fn?fn:opts.ConfigFile);

  kl.forEach( function(i,x,b) {
    if( x == 0 || x == '0')
      return;
    if( typeof opts[i] != 'object' )
      p.set_option(i, tc.makeBool(opts[i]));
    else
      p.set_option(i, opts[i] );
  });

  if( !("ConfigHash" in opts) && parseFile ) {
    p.open();
    p.parse();
  } else if( parseFile && ("ConfigHash" in opts)) {
    p.data = opts.ConfigHash;
    p.open();
    p.parse();
  } else if( "ConfigHash" in opts ) {
    p.data = opts.ConfigHash;
  } else {
    throw new Error('ConfigFile or ConfigHash option needed if you do not pass a configuration filename to this function')
  }

  return Proxy.create(pu.handlerMakerMparse(p));
}

module.exports.parser = cons;
