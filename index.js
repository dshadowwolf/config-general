var parser = require('./lib/parser_wrap'),
    console = require('console'),
    fs = require('fs'),
    util = require('util'),
    tc = require('./lib/type_conv'),
    pu = require('./lib/proxy_helpers');

var opt_legal = {
  ConfigFile: { type: 'string', spec: { name: 'fileexists' } },
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
  NormalizeValue: { type: 'function' },
  SaveSorted: { type: 'boolean' },
  ForceArray: { type: 'boolean' },
  NoEscape: { type: 'boolean' }
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
    } else if( optspec.spec !== undefined ) {
      if( typeof optval != optspec.type ) {
        return false;
      }

      switch(optspec.spec.name) {
        case 'fileexists':
        if( fs.existsSync(optval) === false )
          return false;
        break;
        case 'oneof':
        var ins = false;
        optspec.spec.values.forEach( function(e,i,a) {
          if( optval == e )
            ins = true;
        });
        if( ins === false )
          return false;
        break;
        default:
        throw new Error('Unknown special compare type for parameter '+optspec.spec.name);
        }
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
    if( global.Proxy !== undefined )
	return new Proxy(p, pu.handlerMakerMparse(p)); //Proxy.create(pu.handlerMakerMparse(p));
    else {
      console.warn('Harmony proxies not found, some features provided by the ExtendedAccess flag will be unavailable');
      return p;
    }
  } else
    return p;
}

module.exports.parser = cons;
