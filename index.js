var parser = require('./lib/parser_wrap'),
    console = require('console'),
    fs = require('fs'),
    util = require('util'),
    tc = require('./lib/type_conv'),
    pu = require('./lib/proxy_helpers');

function cons() {
  var opts = {};
  var argv = arguments[0];
  var p = null; // this is where the parser will be

  if( 'string' == typeof argv )
    opts.ConfigFile = argv;
  else if( 'object' == typeof argv )
    opts = new Object(argv);

  p = new parser.parser(opts);

  if( opts.ExtendedAccess !== undefined && opts.ExtendedAccess )
    return Proxy.create(pu.handlerMakerMparse(p));
  else
    return p;
}

module.exports.parser = cons;
