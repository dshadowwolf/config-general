module.exports.get_value = function (variable) {
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  var match = variable.match(varre);
  var sym;

  if( this.symbols[match[2]] !== undefined )
    sym = this.symbols[match[2]];
  else if( match[2].toUpperCase() in process.env )
    sym = process.env[match[2].toUpperCase()];
  else
    throw new Error('Use of unitialized variable ('+variable+')');

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

module.exports.interp = function (value) {
  var resre = /^\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?$/;
  var varre = /\$(\{)?([\w\d_\-\+:,]+)(\})?(?:\[(\d+)\])?/;
  if( resre.test(value) )
    return this.get_var_value(value);

  if( varre.test(value) ) {
    return value.replace( varre,
           function( match, p1, p2, p3, p4, p5, offset, str ) {
             var rv = p1;
             var qc = 0;
             var st= str.slice(0,offset+1);
             st.replace( /(:?[^\\\']\'){1}/g, function(d) { qc++; });

             if( qc == 1 || (qc >= 2 && qc % 2) ) {
               return match;
             }
             if( this.symbols[p3] === undefined )
               throw new Error('Use of uninitialized variable ($'+p3+')' );

             if( p5 !== undefined ) {
               var t = parseInt( p5, 10 );
               if( Array.isArray( this.symbols[p3] ) ) {
                 if( t < this.symbols[p3].length ) {
                   rv = rv.concat( this.symbols[p3][t] );
                 } else {
                   throw new Error('Array subscript out of bounds ($'+p3+'['+p5+'])');
                 }
               } else {
                 throw new Error('Attempt to dereference something that is not an array ($'+p3+')');
               }
             } else {
               if( typeof this.symbols[p3] != 'string' )
                 rv = rv.concat( JSON.stringify(this.symbols[p3]) );
               else
                 rv = rv.concat( this.symbols[p3] );
             }
             return rv;
           });
  }
};