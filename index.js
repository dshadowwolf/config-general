var parser = require('./lib/parser_wrap'),
    console = require('console'),
    fs = require('fs'),
    util = require('util'),
    tc = require('./lib/type_conv'),
    pu = require('./lib/proxy_helpers');

var opt_legal = {
  ConfigFile: { type: 'string', spec: 'fileexists' },
  ConfigHash: { type: 'hash' },
  String: { type: ['array','string'] },
  AllowMultiOptions: { type: 'boolean' },
  LowerCaseNames: { type: 'boolean' },
  UseApacheInclude: { type: 'boolean' },
  IncludeRelative: { type: 'boolean' },
  IncludeGlob: { type: 'boolean' },
  IncludeAgain: { type: 'boolean' },
  IncludeDirectories: { type: 'boolean' },
  ConfigPath: { type: 'array' },
  MergeDuplicateBlocks: { type: 'boolean' },
  MergeDuplicateOptions: { type: 'boolean' },
  AutoTrue: { type: 'boolean' },
  FlagBits: { type: 'hash' },
  DefaultConfig: { type: ['string','hash'] },
  InterPolateVars: { type: 'boolean' },
  InterPolateEnv: { type: 'boolean' },
  AllowSingleQuoteInterpolation: { type: 'boolean' },
  ExtendedAccess: { type: 'boolean' },
  StrictObjects: { type: 'boolean' },
  StrictVars: { type: 'boolean' },
  SplitPolicy: { type: 'string', spec: { name: 'oneof', values: ['guess','whitespace','equalsign','custom'] } },
  SplitDelimiter: { type: ['string','regexp'] },
  StoreDelimiter: { type: 'string' },
  CComments: { type: 'boolean' },
  SlashIsDirectory: { type: 'boolean' },
  ApacheCompatible: { type: 'boolean' },
  NormalizeBlock: { type: 'function' },
  NormalizeOption: { type: 'function' },
  NormalizeValue: { type: 'function' }
};

function checkOption(optname,optval) {
  var optspec = opt_legal[optname];

  if( optspec === undefined )
    return false;

  if( !Array.isArray(optspec.type) ) {
    if( optspec.type == "hash" ) {
      if( Array.isArray(optval) ||
          'object' != typeof(optval) )
        return false;
    } else if( optspec.type == 'array' ) {
        if( !Array.isArray(optval) )
          return false;
    } else if( optspec.type != typeof optval ) {
      return false;
    }
  } else {
    var n = typeof optval;
    var in_list = false;
    optspec.type.forEach( function(e,i,a) {
      if( e == 'hash' ) {
        if( !Array.isArray(optval) &&
            'object' == typeof optval )
          in_list = true;
      } else if( e == 'array' ) {
        if( Array.isArray(optval) )
          in_list = true;
      } else if( n == e )
          in_list = true;
    });

    if( !in_list )
      return false;
  }

  if( optspec.spec !== undefined ) {
    switch( optspec.spec ) {
      case 'fileexists':
      return fs.existsSync( optval );
      break;
      case 'oneof':
      return (optval in optspec.spec);
      break;
      default:
      return false;
    }
  }

  return true;
}

function cons() {
  var opts = {};
  var argv = arguments[0];
  var p = null; // this is where the parser will be

  if( 'string' == typeof argv )
    opts.ConfigFile = argv;
  else if( 'object' == typeof argv )
    opts = argv;

  Object.keys(opts).forEach( function( e,i,a ) {
    if(!checkOption(e,opts[e]))
      throw new Error('Invalid parameter '+opts[e]+' for option '+e);
  });

  p = new parser.parser(opts);

  if( opts.ExtendedAccess !== undefined && opts.ExtendedAccess ) {
    return Proxy.create(pu.handlerMakerMparse(p));
  } else
    return p;
}

module.exports.parser = cons;
