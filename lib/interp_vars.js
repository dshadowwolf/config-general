module.exports.get_value = function (variable) {
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  var match = variable.match(varre);
  var sym;

  if( this.symbols[match[2]] !== undefined )
    sym = this.symbols[match[2]];
  else if( match[2].toUpperCase() in process.env )
    sym = process.env[match[2].toUpperCase()];
  else {
    console.log( require('util').inspect(this.symbols) );
    throw new Error('Use of unitialized variable ('+variable+')');
  }

  if( match[4] !== undefined ) {
    var ind = parseInt(match[4], 10);
    if( !Array.isArray(sym) )
      throw new Error('Attempt to dereference something not an array ('+variable+')');
    if( ind > sym.length )
      throw new Error('Array subscript out of bounds ('+variable+')');
    else
      return sym[ind];
  }
  return sym;
};

var console = require('console');

function parse_for_vars(line) {
  var out = [];
  var vn = "";
  var cp = 0;
  var insq = false;

  var allowed = /[\w\d\[\]\{\}\$]/;
  while( cp < line.length ) {
    if( line[cp] == '$' &&
        line[cp - 1] != '\\' ) {
      while( allowed.test(line[cp]) ) {
        vn = vn + line[cp];
        cp++;
      }
      if( line[cp] == '}' )
        cp++;

      out.push( { v: vn, q: insq } );
      vn = "";
    } else if( line[cp] == '\'' ) {
      insq = !insq;
    }
    cp++;
  }

  return out;
}

module.exports.interp = function (value) {
  var resre = /^\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?$/;
  var varre = /\$\{?([\w\d_\-\+:,]+)\}?(?:\[(\d+)\])?/;
  if( resre.test(value) )
    return this.get_var_value(value);

  var vars = parse_for_vars(value);
  var tval = value;

  var self = this;
  if( vars.length > 0 )
    vars.forEach( function(el,ind,ar) {
      if( self.options.AllowSingleQuoteInterpolation ||
          el.q === false )
        tval = tval.replace( el.v, self.get_var_value(el.v) );
    });

  return tval;
};
