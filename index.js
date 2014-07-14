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
  var fn, opts = {};
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

  if( fn === undefined )
    return this;

  var kl = Object.keys(opts);

  var p = new parser(fn);

  kl.forEach( function(i,x,b) {
    if( x == 0 || x == '0')
      return;
    if( typeof opts[i] != 'object' )
      p.set_option(i, tc.makeBool(opts[i]));
    else
      p.set_option(i, opts[i] );
  });

  if( !("ConfigHash" in kl) ) {
    p.open();
    p.parse();
  } else {
    p.data = p.parser.curblock;
  }

  var asdf = Proxy.create(pu.handlerMakerMparse(p));
  return asdf;
}

module.exports.parser = cons;
