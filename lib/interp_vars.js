module.exports.get_value = function (variable) {
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  var match = variable.match(varre);
  var sym;

  if( this.symbols.get_value(match[2]) != "" )
    sym = this.symbols.get_value(match[2]);
  else if( match[2].toUpperCase() in process.env )
    sym = process.env[match[2].toUpperCase()];
  else {
    if( this.options.StrictVars !== false )
      throw new Error('Use of unitialized variable ('+variable+')');
    else
      console.warn('Uninitialized variable '+variable+' used, this may be  unintentional');
  }
  if( match[4] !== undefined ) {
    var ind = parseInt(match[4], 10);
    if( !Array.isArray(sym) && this.options.StrictVars !== false )
      throw new Error('Attempt to dereference something not an array ('+variable+')');
    else
      return '';

    if( ind > sym.length ) {
      if( this.options.StrictVars !== false )
        throw new Error('Array subscript out of bounds ('+variable+')');
      else {
        console.warn('Array index on variable is out of bounds');
        return '';
      }
    } else
      return sym[ind];
  }
  return sym;
};

var console = require('console');
var util = require('util');
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
